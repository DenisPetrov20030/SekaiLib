using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Infrastructure.Caching;

public sealed class DistributedReadCacheService : IReadCacheService
{
    private readonly IDistributedCache _cache;
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(10);

    public DistributedReadCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        var json = await _cache.GetStringAsync(key);
        return json is null ? null : JsonSerializer.Deserialize<T>(json);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? ttl = null) where T : class
    {
        var json = JsonSerializer.Serialize(value);
        await _cache.SetStringAsync(key, json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl ?? DefaultTtl
        });
    }

    public async Task RemoveAsync(string key)
    {
        await _cache.RemoveAsync(key);
    }
}
