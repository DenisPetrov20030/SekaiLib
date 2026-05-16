namespace SekaiLib.Application.Interfaces;

public interface IReadCacheService
{
    Task<T?> GetAsync<T>(string key) where T : class;
    Task SetAsync<T>(string key, T value, TimeSpan? ttl = null) where T : class;
    Task RemoveAsync(string key);
}
