using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Caching.Distributed;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Infrastructure.Caching;

public sealed class DistributedCacheViewTrackingService : IViewTrackingService
{
    private readonly IDistributedCache _cache;

    public DistributedCacheViewTrackingService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public async Task<bool> TryRecordViewAsync(string entityType, Guid entityId, Guid? userId, string? ipAddress)
    {
        var key = BuildKey(entityType, entityId, userId, ipAddress);
        var existing = await _cache.GetStringAsync(key);
        if (existing != null) return false;

        await _cache.SetStringAsync(key, "1", new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
        });
        return true;
    }

    private static string BuildKey(string entityType, Guid entityId, Guid? userId, string? ipAddress)
    {
        var viewer = userId.HasValue
            ? $"u:{userId}"
            : $"ip:{HashIp(ipAddress ?? "unknown")}";
        return $"view:{entityType}:{entityId}:{viewer}";
    }

    private static string HashIp(string ip)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(bytes)[..16];
    }
}
