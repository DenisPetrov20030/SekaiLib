namespace SekaiLib.Application.DTOs.Auth;

public record ExternalAuthUserProfile(
    ExternalAuthProvider Provider,
    string ProviderUserId,
    string Email,
    string Username,
    string? AvatarUrl
);
