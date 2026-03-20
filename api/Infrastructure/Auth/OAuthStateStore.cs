using Microsoft.Extensions.Caching.Memory;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Infrastructure.Auth;

public class OAuthStateStore : IOAuthStateStore
{
    private readonly IMemoryCache _cache;

    public OAuthStateStore(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task SaveAsync(OAuthAuthorizationRequest request, CancellationToken cancellationToken)
    {
        _cache.Set(GetKey(request.State), request, request.ExpiresAt);
        return Task.CompletedTask;
    }

    public Task<OAuthAuthorizationRequest?> TakeAsync(string state, CancellationToken cancellationToken)
    {
        var key = GetKey(state);
        _cache.TryGetValue<OAuthAuthorizationRequest>(key, out var request);
        if (request is not null)
        {
            _cache.Remove(key);
        }

        return Task.FromResult(request);
    }

    private static string GetKey(string state)
    {
        return $"oauth_state:{state}";
    }
}
