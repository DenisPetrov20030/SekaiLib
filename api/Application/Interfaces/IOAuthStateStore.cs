using SekaiLib.Application.DTOs.Auth;

namespace SekaiLib.Application.Interfaces;

public interface IOAuthStateStore
{
    Task SaveAsync(OAuthAuthorizationRequest request, CancellationToken cancellationToken);
    Task<OAuthAuthorizationRequest?> TakeAsync(string state, CancellationToken cancellationToken);
}
