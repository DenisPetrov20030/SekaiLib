using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Ratings;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;
using System.Security.Claims;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/titles/{titleId}/comments")]
public class TitleCommentsController : ControllerBase
{
    private readonly ITitleCommentService _titleCommentService;

    public TitleCommentsController(ITitleCommentService titleCommentService)
    {
        _titleCommentService = titleCommentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TitleCommentResponse>>> GetComments(Guid titleId)
    {
        Guid? userId = null;
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(idClaim))
            userId = Guid.Parse(idClaim);

        var comments = await _titleCommentService.GetCommentsByTitleAsync(titleId, userId);
        return Ok(comments);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TitleCommentResponse>> AddComment(Guid titleId, [FromBody] CreateTitleCommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var comment = await _titleCommentService.AddCommentAsync(userId.Value, titleId, request);
        return Ok(comment);
    }

    [HttpPut("{commentId}")]
    [Authorize]
    public async Task<ActionResult<TitleCommentResponse>> UpdateComment(Guid titleId, Guid commentId, [FromBody] UpdateTitleCommentRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var comment = await _titleCommentService.UpdateCommentAsync(userId.Value, commentId, request);
        return Ok(comment);
    }

    [HttpPost("{commentId}/reactions")]
    [Authorize]
    public async Task<ActionResult<TitleCommentResponse>> SetCommentReaction(Guid titleId, Guid commentId, [FromBody] SetRatingRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var comment = await _titleCommentService.SetCommentReactionAsync(userId.Value, commentId, request.Type);
        return Ok(comment);
    }

    [HttpDelete("{commentId}/reactions")]
    [Authorize]
    public async Task<ActionResult> RemoveCommentReaction(Guid titleId, Guid commentId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        await _titleCommentService.RemoveCommentReactionAsync(userId.Value, commentId);
        return NoContent();
    }

    [HttpDelete("{commentId}")]
    [Authorize]
    public async Task<ActionResult> DeleteComment(Guid titleId, Guid commentId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var isAdmin = User.IsInRole(UserRole.Administrator.ToString()) || User.IsInRole(UserRole.Moderator.ToString());
        await _titleCommentService.DeleteCommentAsync(userId.Value, commentId, isAdmin);
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(idClaim))
            return null;

        return Guid.Parse(idClaim);
    }
}
