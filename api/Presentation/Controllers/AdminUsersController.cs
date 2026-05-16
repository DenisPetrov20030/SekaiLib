using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Bans;
using SekaiLib.Application.DTOs.Moderation;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Administrator,Moderator")]
public class AdminUsersController : ControllerBase
{
    private readonly IUserBanService _banService;
    private readonly IModerationService _moderation;

    public AdminUsersController(IUserBanService banService, IModerationService moderation)
    {
        _banService = banService;
        _moderation = moderation;
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<UserSearchResultDto>>> SearchUsers([FromQuery] string q)
    {
        var result = await _moderation.SearchUsersAsync(q ?? string.Empty);
        return Ok(result);
    }

    [HttpPost("{userId}/ban")]
    public async Task<ActionResult<UserBanDto>> BanUser(Guid userId, [FromBody] BanUserRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _banService.BanUserAsync(adminId, userId, request);
        return Ok(result);
    }

    [HttpDelete("bans/{banId}")]
    public async Task<ActionResult> Unban(Guid banId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _banService.UnbanUserAsync(adminId, banId);
        return NoContent();
    }

    [HttpGet("bans")]
    public async Task<ActionResult<IEnumerable<UserBanDto>>> GetActiveBans()
    {
        var result = await _banService.GetActiveBansAsync();
        return Ok(result);
    }

    [HttpGet("{userId}/bans")]
    public async Task<ActionResult<IEnumerable<UserBanDto>>> GetUserBans(Guid userId)
    {
        var result = await _banService.GetUserBansAsync(userId);
        return Ok(result);
    }
}
