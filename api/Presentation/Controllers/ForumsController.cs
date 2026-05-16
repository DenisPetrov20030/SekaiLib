using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Forum;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/forum")]
public class ForumsController : ControllerBase
{
    private readonly IForumService _forumService;

    public ForumsController(IForumService forumService)
    {
        _forumService = forumService;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private Guid? OptionalUserId
    {
        get
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return claim != null && Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    // ── Categories ────────────────────────────────────────────────────────────

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<ForumCategoryDto>>> GetCategories()
    {
        var result = await _forumService.GetCategoriesAsync();
        return Ok(result);
    }

    [HttpPost("categories")]
    [Authorize]
    public async Task<ActionResult<ForumCategoryDto>> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var result = await _forumService.CreateCategoryAsync(UserId, request);
        return Ok(result);
    }

    [HttpPut("categories/{categoryId}")]
    [Authorize]
    public async Task<ActionResult<ForumCategoryDto>> UpdateCategory(Guid categoryId, [FromBody] UpdateCategoryRequest request)
    {
        var result = await _forumService.UpdateCategoryAsync(UserId, categoryId, request);
        return Ok(result);
    }

    [HttpDelete("categories/{categoryId}")]
    [Authorize]
    public async Task<IActionResult> DeleteCategory(Guid categoryId)
    {
        await _forumService.DeleteCategoryAsync(UserId, categoryId);
        return NoContent();
    }

    // ── Threads ───────────────────────────────────────────────────────────────

    [HttpGet("categories/{categoryId}/threads")]
    public async Task<ActionResult<PagedResult<ForumThreadDto>>> GetThreads(
        Guid categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _forumService.GetThreadsAsync(categoryId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("threads/search")]
    public async Task<ActionResult<PagedResult<ForumThreadDto>>> SearchThreads(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _forumService.SearchThreadsAsync(q, page, pageSize);
        return Ok(result);
    }

    [HttpGet("threads/{threadId}")]
    public async Task<ActionResult<ForumThreadDetailsDto>> GetThread(Guid threadId)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _forumService.GetThreadAsync(threadId, OptionalUserId, ip);
        return Ok(result);
    }

    [HttpPost("threads")]
    [Authorize]
    public async Task<ActionResult<ForumThreadDetailsDto>> CreateThread([FromBody] CreateThreadRequest request)
    {
        var result = await _forumService.CreateThreadAsync(UserId, request);
        return Ok(result);
    }

    [HttpDelete("threads/{threadId}")]
    [Authorize]
    public async Task<IActionResult> DeleteThread(Guid threadId)
    {
        await _forumService.DeleteThreadAsync(UserId, threadId);
        return NoContent();
    }

    [HttpPut("threads/{threadId}/pin")]
    [Authorize]
    public async Task<IActionResult> PinThread(Guid threadId, [FromQuery] bool pinned = true)
    {
        await _forumService.PinThreadAsync(UserId, threadId, pinned);
        return NoContent();
    }

    [HttpPut("threads/{threadId}/lock")]
    [Authorize]
    public async Task<IActionResult> LockThread(Guid threadId, [FromQuery] bool locked = true)
    {
        await _forumService.LockThreadAsync(UserId, threadId, locked);
        return NoContent();
    }

    // ── Posts ─────────────────────────────────────────────────────────────────

    [HttpGet("threads/{threadId}/posts")]
    public async Task<ActionResult<PagedResult<ForumPostDto>>> GetPosts(
        Guid threadId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
        var result = await _forumService.GetPostsAsync(threadId, OptionalUserId, page, pageSize);
        return Ok(result);
    }

    [HttpPost("threads/{threadId}/posts")]
    [Authorize]
    public async Task<ActionResult<ForumPostDto>> CreatePost(Guid threadId, [FromBody] CreatePostRequest request)
    {
        var result = await _forumService.CreatePostAsync(UserId, threadId, request);
        return Ok(result);
    }

    [HttpPut("posts/{postId}")]
    [Authorize]
    public async Task<ActionResult<ForumPostDto>> UpdatePost(Guid postId, [FromBody] UpdatePostRequest request)
    {
        var result = await _forumService.UpdatePostAsync(UserId, postId, request);
        return Ok(result);
    }

    [HttpDelete("posts/{postId}")]
    [Authorize]
    public async Task<IActionResult> DeletePost(Guid postId)
    {
        await _forumService.DeletePostAsync(UserId, postId);
        return NoContent();
    }

    [HttpPost("posts/{postId}/react")]
    [Authorize]
    public async Task<ActionResult<ForumPostDto>> React(Guid postId, [FromBody] ReactRequest request)
    {
        var result = await _forumService.ReactAsync(UserId, postId, request.IsLike);
        return Ok(result);
    }

    [HttpDelete("posts/{postId}/react")]
    [Authorize]
    public async Task<ActionResult<ForumPostDto>> RemoveReaction(Guid postId)
    {
        var result = await _forumService.RemoveReactionAsync(UserId, postId);
        return Ok(result);
    }
}

public record ReactRequest(bool IsLike);
