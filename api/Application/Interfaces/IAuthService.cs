using SekaiLib.Application.DTOs.Auth;

namespace SekaiLib.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> CompleteOAuthAsync(CompleteOAuthRequest request, CancellationToken cancellationToken);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<UserDto> GetCurrentUserAsync(Guid userId);
}
