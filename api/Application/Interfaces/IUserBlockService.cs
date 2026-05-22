using SekaiLib.Application.DTOs.Users;

namespace SekaiLib.Application.Interfaces;

public interface IUserBlockService
{
    Task BlockAsync(Guid blockerId, Guid blockedUserId);
    Task UnblockAsync(Guid blockerId, Guid blockedUserId);
    Task<bool> IsBlockedAsync(Guid blockerId, Guid blockedUserId);
    Task<bool> IsBlockedByAsync(Guid userId, Guid potentialBlockerId);
    Task<IEnumerable<Guid>> GetBlockedUserIdsAsync(Guid blockerId);
    Task<IEnumerable<BlockedUserDto>> GetBlockedUsersWithDetailsAsync(Guid blockerId);
}
