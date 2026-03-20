using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Application.Services;

public class ExternalAuthService : IExternalAuthService
{
    private readonly IReadOnlyDictionary<ExternalAuthProvider, IExternalAuthProvider> _providers;
    private readonly IOAuthFlowService _oAuthFlowService;
    private readonly IOAuthStateStore _stateStore;
    private readonly IExternalAuthTicketStore _ticketStore;

    public ExternalAuthService(
        IEnumerable<IExternalAuthProvider> providers,
        IOAuthFlowService oAuthFlowService,
        IOAuthStateStore stateStore,
        IExternalAuthTicketStore ticketStore)
    {
        _providers = providers.ToDictionary(x => x.Provider, x => x);
        _oAuthFlowService = oAuthFlowService;
        _stateStore = stateStore;
        _ticketStore = ticketStore;
    }

    public async Task<OAuthAuthorizationResult> StartAsync(
        ExternalAuthProvider provider,
        string returnUrl,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        if (!_providers.TryGetValue(provider, out var externalProvider))
        {
            throw new ValidationException("provider", "Unsupported provider");
        }

        var state = _oAuthFlowService.CreateState();
        var codeVerifier = _oAuthFlowService.CreateCodeVerifier();
        var codeChallenge = _oAuthFlowService.CreateCodeChallenge(codeVerifier);

        var request = new OAuthAuthorizationRequest(
            provider,
            state,
            codeVerifier,
            returnUrl,
            DateTime.UtcNow.AddMinutes(10));

        await _stateStore.SaveAsync(request, cancellationToken);

        var authorizationUrl = await externalProvider.BuildAuthorizationUrlAsync(
            state,
            codeChallenge,
            redirectUri,
            cancellationToken);

        return new OAuthAuthorizationResult(authorizationUrl);
    }

    public async Task<OAuthCallbackResult> HandleCallbackAsync(
        OAuthCallbackRequest request,
        string redirectUri,
        CancellationToken cancellationToken)
    {
        if (!_providers.TryGetValue(request.Provider, out var externalProvider))
        {
            throw new ValidationException("provider", "Unsupported provider");
        }

        var authorizationRequest = await _stateStore.TakeAsync(request.State, cancellationToken);
        if (authorizationRequest is null || authorizationRequest.Provider != request.Provider || authorizationRequest.ExpiresAt < DateTime.UtcNow)
        {
            throw new UnauthorizedException("Invalid oauth state");
        }

        var profile = await externalProvider.GetUserProfileAsync(
            request.Code,
            authorizationRequest.CodeVerifier,
            redirectUri,
            cancellationToken);

        var ticket = await _ticketStore.CreateAsync(profile, authorizationRequest.ReturnUrl, cancellationToken);
        return new OAuthCallbackResult(ticket, authorizationRequest.ReturnUrl);
    }
}
