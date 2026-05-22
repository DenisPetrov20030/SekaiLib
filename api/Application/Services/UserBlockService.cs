using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Users;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class UserBlockService : IUserBlockService
{
    private readonly IUnitOfWork _unitOfWork;

    public UserBlockService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task BlockAsync(Guid blockerId, Guid blockedUserId)
    {
        if (blockerId == blockedUserId)
            throw new ValidationException(new Dictionary<string, string[]>
                { { "Block", new[] { "You cannot block yourself" } } });

        var exists = await _unitOfWork.UserBlocks.Query()
            .AnyAsync(b => b.BlockerId == blockerId && b.BlockedUserId == blockedUserId);

        if (exists) return;

        var block = new UserBlock
        {
            Id = Guid.NewGuid(),
            BlockerId = blockerId,
            BlockedUserId = blockedUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.UserBlocks.AddAsync(block);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UnblockAsync(Guid blockerId, Guid blockedUserId)
    {
        var block = await _unitOfWork.UserBlocks.Query()
            .FirstOrDefaultAsync(b => b.BlockerId == blockerId && b.BlockedUserId == blockedUserId);

        if (block == null) return;

        await _unitOfWork.UserBlocks.DeleteAsync(block);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<bool> IsBlockedAsync(Guid blockerId, Guid blockedUserId)
    {
        return await _unitOfWork.UserBlocks.Query()
            .AnyAsync(b => b.BlockerId == blockerId && b.BlockedUserId == blockedUserId);
    }

    public async Task<bool> IsBlockedByAsync(Guid userId, Guid potentialBlockerId)
    {
        return await _unitOfWork.UserBlocks.Query()
            .AnyAsync(b => b.BlockerId == potentialBlockerId && b.BlockedUserId == userId);
    }

    public async Task<IEnumerable<Guid>> GetBlockedUserIdsAsync(Guid blockerId)
    {
        return await _unitOfWork.UserBlocks.Query()
            .Where(b => b.BlockerId == blockerId)
            .Select(b => b.BlockedUserId)
            .ToListAsync();
    }

    public async Task<IEnumerable<BlockedUserDto>> GetBlockedUsersWithDetailsAsync(Guid blockerId)
    {
        return await _unitOfWork.UserBlocks.Query()
            .Include(b => b.BlockedUser)
            .Where(b => b.BlockerId == blockerId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BlockedUserDto(
                b.BlockedUserId,
                b.BlockedUser.Username,
                b.BlockedUser.AvatarUrl,
                b.CreatedAt))
            .ToListAsync();
    }
}
