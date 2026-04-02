using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Teams;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/teams")]
public class TranslationTeamsController : ControllerBase
{
    private readonly ITranslationTeamService _teamService;

    public TranslationTeamsController(ITranslationTeamService teamService)
    {
        _teamService = teamService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TranslationTeamDto>>> GetAll()
    {
        var teams = await _teamService.GetAllAsync();
        return Ok(teams);
    }

    [HttpGet("{teamId:guid}")]
    public async Task<ActionResult<TranslationTeamDto>> GetById(Guid teamId)
    {
        var team = await _teamService.GetByIdAsync(teamId);
        return Ok(team);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TranslationTeamDto>> Create([FromBody] CreateTeamRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var team = await _teamService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { teamId = team.Id }, team);
    }

    [HttpPut("{teamId:guid}")]
    [Authorize]
    public async Task<ActionResult<TranslationTeamDto>> Update(Guid teamId, [FromBody] UpdateTeamRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var team = await _teamService.UpdateAsync(userId, teamId, request);
        return Ok(team);
    }

    [HttpDelete("{teamId:guid}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.DeleteAsync(userId, teamId);
        return NoContent();
    }

    // Members

    [HttpGet("{teamId:guid}/members")]
    public async Task<ActionResult<IEnumerable<TeamMemberDto>>> GetMembers(Guid teamId)
    {
        var members = await _teamService.GetMembersAsync(teamId);
        return Ok(members);
    }

    [HttpPost("{teamId:guid}/members")]
    [Authorize]
    public async Task<ActionResult<TeamMemberDto>> AddMember(Guid teamId, [FromBody] AddMemberRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var member = await _teamService.AddMemberAsync(userId, teamId, request);
        return Ok(member);
    }

    [HttpDelete("{teamId:guid}/members/{targetUserId:guid}")]
    [Authorize]
    public async Task<ActionResult> RemoveMember(Guid teamId, Guid targetUserId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.RemoveMemberAsync(userId, teamId, targetUserId);
        return NoContent();
    }

    [HttpPut("{teamId:guid}/members/{targetUserId:guid}/role")]
    [Authorize]
    public async Task<ActionResult<TeamMemberDto>> UpdateMemberRole(Guid teamId, Guid targetUserId, [FromBody] UpdateMemberRoleRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var member = await _teamService.UpdateMemberRoleAsync(userId, teamId, targetUserId, request);
        return Ok(member);
    }

    // Subscriptions

    [HttpPost("{teamId:guid}/subscribe")]
    [Authorize]
    public async Task<ActionResult> Subscribe(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.SubscribeAsync(userId, teamId);
        return NoContent();
    }

    [HttpDelete("{teamId:guid}/subscribe")]
    [Authorize]
    public async Task<ActionResult> Unsubscribe(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.UnsubscribeAsync(userId, teamId);
        return NoContent();
    }

    [HttpGet("{teamId:guid}/subscribed")]
    [Authorize]
    public async Task<ActionResult<bool>> IsSubscribed(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _teamService.IsSubscribedAsync(userId, teamId);
        return Ok(result);
    }

    // Recent chapters from all subscribed teams

    [HttpGet("subscribed/chapters")]
    [Authorize]
    public async Task<ActionResult> GetSubscribedChapters([FromQuery] int count = 20)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var chapters = await _teamService.GetRecentChaptersFromSubscribedTeamsAsync(userId, count);
        return Ok(chapters);
    }

    // Chapters (updates feed with pagination)

    [HttpGet("{teamId:guid}/chapters")]
    public async Task<ActionResult> GetChapters(Guid teamId, [FromQuery] int page = 1, [FromQuery] int pageSize = 15)
    {
        var (items, totalCount) = await _teamService.GetTeamChaptersAsync(teamId, page, pageSize);
        return Ok(new
        {
            data = items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }
}
