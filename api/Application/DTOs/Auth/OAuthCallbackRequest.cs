namespace SekaiLib.Application.DTOs.Auth;

public record OAuthCallbackRequest(
    ExternalAuthProvider Provider,
    string Code,
    string State
);
