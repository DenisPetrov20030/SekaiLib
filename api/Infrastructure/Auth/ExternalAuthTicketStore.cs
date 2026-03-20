using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Options;

namespace SekaiLib.Infrastructure.Auth;

public class ExternalAuthTicketStore : IExternalAuthTicketStore
{
    private readonly IMemoryCache _cache;
    private readonly OAuthOptions _options;

    public ExternalAuthTicketStore(IMemoryCache cache, IOptions<OAuthOptions> options)
    {
        _cache = cache;
        _options = options.Value;
    }

    public Task<string> CreateAsync(ExternalAuthUserProfile profile, string returnUrl, CancellationToken cancellationToken)
    {
        var ticket = Guid.NewGuid().ToString("N");
        var payload = new TicketPayload(profile, returnUrl);
        _cache.Set(GetKey(ticket), payload, TimeSpan.FromMinutes(_options.TicketTtlMinutes));
        return Task.FromResult(ticket);
    }

    public Task<(ExternalAuthUserProfile Profile, string ReturnUrl)?> TakeAsync(string ticket, CancellationToken cancellationToken)
    {
        var key = GetKey(ticket);
        _cache.TryGetValue<TicketPayload>(key, out var payload);
        if (payload is null)
        {
            return Task.FromResult<(ExternalAuthUserProfile Profile, string ReturnUrl)?>(null);
        }

        _cache.Remove(key);
        return Task.FromResult<(ExternalAuthUserProfile Profile, string ReturnUrl)?>(
            (payload.Profile, payload.ReturnUrl));
    }

    private static string GetKey(string ticket)
    {
        return $"oauth_ticket:{ticket}";
    }

    private record TicketPayload(ExternalAuthUserProfile Profile, string ReturnUrl);
}
