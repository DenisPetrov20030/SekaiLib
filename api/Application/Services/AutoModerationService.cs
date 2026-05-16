using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SekaiLib.Application.Services;

public partial class AutoModerationService : IAutoModerationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IDistributedCache _cache;

    private const string CacheKey = "automod:badwords";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    public AutoModerationService(IUnitOfWork unitOfWork, IDistributedCache cache)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
    }

    public async Task<AutoModerationResult> CheckAsync(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return new AutoModerationResult(false, null);

        var normalized = content.ToLowerInvariant();

        // 1. Profanity — bad-word list from DB (Redis-cached)
        var badWords = await GetBadWordsAsync();
        foreach (var word in badWords)
        {
            if (normalized.Contains(word, StringComparison.OrdinalIgnoreCase))
                return new AutoModerationResult(true, "profanity");
        }

        // 2. Spam — >3 identical non-empty lines
        var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (lines.Length > 3)
        {
            var grouped = lines.GroupBy(l => l.ToLowerInvariant()).Max(g => g.Count());
            if (grouped > 3)
                return new AutoModerationResult(true, "spam");
        }

        // 3. Caps abuse — >70% uppercase letters in strings longer than 20 chars
        var letters = content.Where(char.IsLetter).ToArray();
        if (letters.Length > 20)
        {
            var upperRatio = (double)letters.Count(char.IsUpper) / letters.Length;
            if (upperRatio > 0.70)
                return new AutoModerationResult(true, "caps_abuse");
        }

        return new AutoModerationResult(false, null);
    }

    public async Task InvalidateCacheAsync()
    {
        await _cache.RemoveAsync(CacheKey);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private async Task<List<string>> GetBadWordsAsync()
    {
        var cached = await _cache.GetStringAsync(CacheKey);
        if (cached != null)
            return JsonSerializer.Deserialize<List<string>>(cached) ?? new();

        var words = await _unitOfWork.BadWords.Query()
            .Select(w => w.Word.ToLower())
            .ToListAsync();

        var json = JsonSerializer.Serialize(words);
        await _cache.SetStringAsync(CacheKey, json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = CacheTtl
        });

        return words;
    }
}
