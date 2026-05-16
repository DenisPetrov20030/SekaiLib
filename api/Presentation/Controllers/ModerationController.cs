using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Moderation;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/moderation")]
[Authorize(Roles = "Administrator,Moderator")]
public class ModerationController : ControllerBase
{
    private readonly IModerationService _moderation;

    public ModerationController(IModerationService moderation)
    {
        _moderation = moderation;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── Queue ────────────────────────────────────────────────────────────────

    [HttpGet("queue")]
    public async Task<ActionResult<PagedResult<ModerationQueueItemDto>>> GetQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] ModerationStatus? status = null)
    {
        var result = await _moderation.GetQueueAsync(page, pageSize, status);
        return Ok(result);
    }

    [HttpGet("queue/{id:guid}")]
    public async Task<ActionResult<ModerationQueueItemDto>> GetQueueItem(Guid id)
    {
        var item = await _moderation.GetQueueItemAsync(id);
        return Ok(item);
    }

    [HttpPut("queue/{id:guid}/approve")]
    public async Task<ActionResult> Approve(Guid id)
    {
        await _moderation.ApproveAsync(CurrentUserId, id);
        return NoContent();
    }

    [HttpPut("queue/{id:guid}/reject")]
    public async Task<ActionResult> Reject(Guid id, [FromBody] RejectQueueItemRequest request)
    {
        await _moderation.RejectAsync(CurrentUserId, id, request.Reason);
        return NoContent();
    }

    // ── Logs ─────────────────────────────────────────────────────────────────

    [HttpGet("logs")]
    public async Task<ActionResult<PagedResult<ModerationLogDto>>> GetLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _moderation.GetLogsAsync(page, pageSize);
        return Ok(result);
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    [HttpGet("stats")]
    public async Task<ActionResult<ModerationStatsDto>> GetStats()
    {
        var result = await _moderation.GetStatsAsync();
        return Ok(result);
    }

    // ── Warnings ──────────────────────────────────────────────────────────────

    [HttpPost("warnings")]
    public async Task<ActionResult<UserWarningDto>> IssueWarning([FromBody] IssueWarningRequest request)
    {
        var result = await _moderation.IssueWarningAsync(CurrentUserId, request.UserId, request.Reason);
        return Ok(result);
    }

    [HttpDelete("warnings/{id:guid}")]
    public async Task<ActionResult> RevokeWarning(Guid id)
    {
        await _moderation.RevokeWarningAsync(CurrentUserId, id);
        return NoContent();
    }

    [HttpGet("users/{userId:guid}/warnings")]
    public async Task<ActionResult<IEnumerable<UserWarningDto>>> GetUserWarnings(Guid userId)
    {
        var result = await _moderation.GetUserWarningsAsync(userId);
        return Ok(result);
    }

    // ── Bad Words ─────────────────────────────────────────────────────────────

    [HttpGet("bad-words")]
    public async Task<ActionResult<IEnumerable<BadWordDto>>> GetBadWords()
    {
        var result = await _moderation.GetBadWordsAsync();
        return Ok(result);
    }

    [HttpPost("bad-words")]
    public async Task<ActionResult<BadWordDto>> AddBadWord([FromBody] AddBadWordRequest request)
    {
        var result = await _moderation.AddBadWordAsync(CurrentUserId, request.Word);
        return Ok(result);
    }

    [HttpDelete("bad-words/{id:guid}")]
    public async Task<ActionResult> RemoveBadWord(Guid id)
    {
        await _moderation.RemoveBadWordAsync(CurrentUserId, id);
        return NoContent();
    }
}
