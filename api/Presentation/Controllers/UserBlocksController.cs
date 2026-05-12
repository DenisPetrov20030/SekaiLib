using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Users;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/blocks")]
[Authorize]
public class UserBlocksController : ControllerBase
{
    private readonly IUserBlockService _blockService;

    public UserBlocksController(IUserBlockService blockService)
    {
        _blockService = blockService;
    }

    [HttpPost("{userId}")]
    public async Task<ActionResult> Block(Guid userId)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _blockService.BlockAsync(currentUserId, userId);
        return NoContent();
    }

    [HttpDelete("{userId}")]
    public async Task<ActionResult> Unblock(Guid userId)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _blockService.UnblockAsync(currentUserId, userId);
        return NoContent();
    }

    [HttpGet("{userId}/status")]
    public async Task<ActionResult<bool>> IsBlocked(Guid userId)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _blockService.IsBlockedAsync(currentUserId, userId);
        return Ok(result);
    }

    [HttpGet("{userId}/message-access")]
    public async Task<ActionResult<MessageAccessDto>> GetMessageAccess(Guid userId)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var blockedByMe = await _blockService.IsBlockedAsync(currentUserId, userId);
        var blockedByUser = await _blockService.IsBlockedAsync(userId, currentUserId);

        return Ok(new MessageAccessDto(
            CanMessage: !blockedByMe && !blockedByUser,
            BlockedByMe: blockedByMe,
            BlockedByUser: blockedByUser
        ));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Guid>>> GetBlockedUsers()
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _blockService.GetBlockedUserIdsAsync(currentUserId);
        return Ok(result);
    }

    [HttpGet("details")]
    public async Task<ActionResult<IEnumerable<BlockedUserDto>>> GetBlockedUsersWithDetails()
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _blockService.GetBlockedUsersWithDetailsAsync(currentUserId);
        return Ok(result);
    }
}
