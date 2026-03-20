using SekaiLib.Application.DTOs.Auth;

namespace SekaiLib.Application.Interfaces;

public interface IExternalAuthService
{
    Task<OAuthAuthorizationResult> StartAsync(ExternalAuthProvider provider, string returnUrl, string redirectUri, CancellationToken cancellationToken);
    Task<OAuthCallbackResult> HandleCallbackAsync(OAuthCallbackRequest request, string redirectUri, CancellationToken cancellationToken);
}
