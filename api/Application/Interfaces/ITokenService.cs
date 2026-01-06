using SekaiLib.Domain.Entities;

namespace SekaiLib.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Task<RefreshToken> SaveRefreshTokenAsync(Guid userId, string token);
    Task<RefreshToken?> ValidateRefreshTokenAsync(string token);
}
