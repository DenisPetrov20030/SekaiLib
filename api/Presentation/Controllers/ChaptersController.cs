using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Ratings;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChaptersController : ControllerBase
{
    private readonly IChapterService _chapterService;

    public ChaptersController(IChapterService chapterService)
    {
        _chapterService = chapterService;
    }

    [HttpGet("title/{titleId}")]
    public async Task<ActionResult<IEnumerable<ChapterDto>>> GetChaptersByTitle(Guid titleId)
    {
        var chapters = await _chapterService.GetChaptersByTitleAsync(titleId);
        return Ok(chapters);
    }

    [HttpGet("{chapterId}")]
    public async Task<ActionResult<ChapterContentDto>> GetChapterContent(Guid chapterId)
    {
        var chapter = await _chapterService.GetChapterContentAsync(chapterId);
        return Ok(chapter);
    }

    [HttpPost("title/{titleId}")]
    [Authorize]
    public async Task<ActionResult<ChapterContentDto>> Create(Guid titleId, [FromBody] CreateChapterRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var chapter = await _chapterService.CreateAsync(userId, titleId, request);
        return CreatedAtAction(nameof(GetChapterContent), new { chapterId = chapter.Id }, chapter);
    }

    [HttpPut("{chapterId}")]
    [Authorize]
    public async Task<ActionResult<ChapterContentDto>> Update(Guid chapterId, [FromBody] UpdateChapterRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var chapter = await _chapterService.UpdateAsync(userId, chapterId, request);
        return Ok(chapter);
    }

    [HttpDelete("{chapterId}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid chapterId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _chapterService.DeleteAsync(userId, chapterId);
        return NoContent();
    }

    // Comments
    [HttpGet("{chapterId}/comments")]
    public async Task<ActionResult<IEnumerable<ChapterCommentResponse>>> GetComments(Guid chapterId)
    {
        Guid? userId = null;
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(idClaim))
            userId = Guid.Parse(idClaim);

        var comments = await _chapterService.GetCommentsAsync(chapterId, userId);
        return Ok(comments);
    }

    [HttpPost("{chapterId}/comments")]
    [Authorize]
    public async Task<ActionResult<ChapterCommentResponse>> AddComment(Guid chapterId, [FromBody] CreateChapterCommentRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var comment = await _chapterService.AddCommentAsync(userId, chapterId, request);
        return Ok(comment);
    }

    [HttpPut("{chapterId}/comments/{commentId}")]
    [Authorize]
    public async Task<ActionResult<ChapterCommentResponse>> UpdateComment(Guid chapterId, Guid commentId, [FromBody] UpdateChapterCommentRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var comment = await _chapterService.UpdateCommentAsync(userId, commentId, request);
        return Ok(comment);
    }

    [HttpPost("{chapterId}/comments/{commentId}/reactions")]
    [Authorize]
    public async Task<ActionResult<ChapterCommentResponse>> SetCommentReaction(Guid chapterId, Guid commentId, [FromBody] SetRatingRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var comment = await _chapterService.SetCommentReactionAsync(userId, commentId, request.Type);
        return Ok(comment);
    }

    [HttpDelete("{chapterId}/comments/{commentId}/reactions")]
    [Authorize]
    public async Task<ActionResult> RemoveCommentReaction(Guid chapterId, Guid commentId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _chapterService.RemoveCommentReactionAsync(userId, commentId);
        return NoContent();
    }

    [HttpDelete("{chapterId}/comments/{commentId}")]
    [Authorize]
    public async Task<ActionResult> DeleteComment(Guid chapterId, Guid commentId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _chapterService.DeleteCommentAsync(userId, commentId);
        return NoContent();
    }
}
