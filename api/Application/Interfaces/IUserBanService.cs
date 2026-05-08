using SekaiLib.Application.DTOs.Bans;

namespace SekaiLib.Application.Interfaces;

public interface IUserBanService
{
    Task<UserBanDto> BanUserAsync(Guid adminId, Guid userId, BanUserRequest request);
    Task UnbanUserAsync(Guid adminId, Guid banId);
    Task<IEnumerable<UserBanDto>> GetActiveBansAsync();
    Task<IEnumerable<UserBanDto>> GetUserBansAsync(Guid userId);
    Task<bool> IsUserBannedAsync(Guid userId);
}
