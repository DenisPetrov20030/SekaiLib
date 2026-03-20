using SekaiLib.Application.DTOs.Auth;

namespace SekaiLib.Application.Interfaces;

public interface IExternalAuthProvider
{
    ExternalAuthProvider Provider { get; }
    Task<string> BuildAuthorizationUrlAsync(string state, string codeChallenge, string redirectUri, CancellationToken cancellationToken);
    Task<ExternalAuthUserProfile> GetUserProfileAsync(string code, string codeVerifier, string redirectUri, CancellationToken cancellationToken);
}
