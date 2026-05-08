using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Bans;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class UserBanService : IUserBanService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserBanService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<UserBanDto> BanUserAsync(Guid adminId, Guid userId, BanUserRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var ban = new UserBan
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BannedByUserId = adminId,
            Reason = request.Reason,
            ExpiresAt = request.ExpiresAt,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.UserBans.AddAsync(ban);
        await _unitOfWork.SaveChangesAsync();

        var admin = await _unitOfWork.Users.GetByIdAsync(adminId);

        return new UserBanDto
        {
            Id = ban.Id,
            UserId = user.Id,
            Username = user.Username,
            AvatarUrl = user.AvatarUrl,
            BannedByUserId = adminId,
            BannedByUsername = admin?.Username ?? string.Empty,
            Reason = ban.Reason,
            ExpiresAt = ban.ExpiresAt,
            IsActive = ban.IsActive,
            CreatedAt = ban.CreatedAt
        };
    }

    public async Task UnbanUserAsync(Guid adminId, Guid banId)
    {
        var ban = await _unitOfWork.UserBans.GetByIdAsync(banId)
            ?? throw new NotFoundException("Ban", banId);

        ban.IsActive = false;
        await _unitOfWork.UserBans.UpdateAsync(ban);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserBanDto>> GetActiveBansAsync()
    {
        var bans = await _unitOfWork.UserBans.Query()
            .Include(b => b.User)
            .Include(b => b.BannedByUser)
            .Where(b => b.IsActive && (b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow))
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bans.Select(MapToDto);
    }

    public async Task<IEnumerable<UserBanDto>> GetUserBansAsync(Guid userId)
    {
        var bans = await _unitOfWork.UserBans.Query()
            .Include(b => b.User)
            .Include(b => b.BannedByUser)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bans.Select(MapToDto);
    }

    public async Task<bool> IsUserBannedAsync(Guid userId)
    {
        return await _unitOfWork.UserBans.Query()
            .AnyAsync(b => b.UserId == userId && b.IsActive &&
                           (b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow));
    }

    private static UserBanDto MapToDto(UserBan ban) => new()
    {
        Id = ban.Id,
        UserId = ban.UserId,
        Username = ban.User.Username,
        AvatarUrl = ban.User.AvatarUrl,
        BannedByUserId = ban.BannedByUserId,
        BannedByUsername = ban.BannedByUser.Username,
        Reason = ban.Reason,
        ExpiresAt = ban.ExpiresAt,
        IsActive = ban.IsActive,
        CreatedAt = ban.CreatedAt
    };
}
