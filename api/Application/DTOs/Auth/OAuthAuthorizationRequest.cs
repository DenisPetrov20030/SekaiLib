namespace SekaiLib.Application.DTOs.Auth;

public record OAuthAuthorizationRequest(
    ExternalAuthProvider Provider,
    string State,
    string CodeVerifier,
    string ReturnUrl,
    DateTime ExpiresAt
);
