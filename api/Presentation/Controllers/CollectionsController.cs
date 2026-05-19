using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Collections;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollectionsController : ControllerBase
{
    private readonly ICollectionService _collectionService;
    private readonly ICollectionCommentService _commentService;
    private readonly IUnitOfWork _unitOfWork;

    public CollectionsController(
        ICollectionService collectionService,
        ICollectionCommentService commentService,
        IUnitOfWork unitOfWork)
    {
        _collectionService = collectionService;
        _commentService = commentService;
        _unitOfWork = unitOfWork;
    }

    // ─── Collections CRUD ─────────────────────────────────────────────────────

    [HttpGet]
    public async Task<ActionResult<PagedResult<CollectionDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _collectionService.GetAllAsync(search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CollectionDetailsDto>> GetById(Guid id)
    {
        var viewerUserId = GetCurrentUserId();
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _collectionService.GetByIdAsync(id, viewerUserId, ip);
        return Ok(result);
    }

    [HttpGet("by-user/{userId}")]
    public async Task<ActionResult<IEnumerable<CollectionDto>>> GetByUser(Guid userId, [FromQuery] Guid? titleId = null)
    {
        var result = await _collectionService.GetByUserAsync(userId, titleId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CollectionDetailsDto>> Create([FromBody] CreateCollectionRequest request)
    {
        var userId = GetRequiredUserId();
        var result = await _collectionService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<CollectionDetailsDto>> Update(Guid id, [FromBody] UpdateCollectionRequest request)
    {
        var userId = GetRequiredUserId();
        var result = await _collectionService.UpdateAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetRequiredUserId();
        await _collectionService.DeleteAsync(userId, id);
        return NoContent();
    }

    // ─── Sections ─────────────────────────────────────────────────────────────

    [HttpPost("{id}/sections")]
    [Authorize]
    public async Task<ActionResult<CollectionSectionDto>> AddSection(Guid id, [FromBody] AddSectionRequest request)
    {
        var userId = GetRequiredUserId();
        var result = await _collectionService.AddSectionAsync(userId, id, request);
        return Ok(result);
    }

    [HttpPut("{id}/sections/{sectionId}")]
    [Authorize]
    public async Task<IActionResult> UpdateSection(Guid id, Guid sectionId, [FromBody] UpdateSectionRequest request)
    {
        var userId = GetRequiredUserId();
        await _collectionService.UpdateSectionAsync(userId, id, sectionId, request.Name);
        return NoContent();
    }

    [HttpDelete("{id}/sections/{sectionId}")]
    [Authorize]
    public async Task<IActionResult> DeleteSection(Guid id, Guid sectionId)
    {
        var userId = GetRequiredUserId();
        await _collectionService.DeleteSectionAsync(userId, id, sectionId);
        return NoContent();
    }

    // ─── Items ────────────────────────────────────────────────────────────────

    [HttpPost("{id}/items")]
    [Authorize]
    public async Task<ActionResult<CollectionItemDto>> AddItem(Guid id, [FromBody] AddCollectionItemRequest request)
    {
        var userId = GetRequiredUserId();
        var result = await _collectionService.AddItemAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("{id}/items/{itemId}")]
    [Authorize]
    public async Task<IActionResult> RemoveItem(Guid id, Guid itemId)
    {
        var userId = GetRequiredUserId();
        await _collectionService.RemoveItemAsync(userId, id, itemId);
        return NoContent();
    }

    [HttpPut("{id}/items/{itemId}/section")]
    [Authorize]
    public async Task<IActionResult> UpdateItemSection(Guid id, Guid itemId, [FromBody] UpdateCollectionItemSectionRequest request)
    {
        var userId = GetRequiredUserId();
        await _collectionService.UpdateItemSectionAsync(userId, id, itemId, request.SectionId);
        return NoContent();
    }

    // ─── Reactions ────────────────────────────────────────────────────────────

    [HttpPost("{id}/react")]
    [Authorize]
    public async Task<IActionResult> React(Guid id, [FromBody] ReactRequest request)
    {
        var userId = GetRequiredUserId();
        await _collectionService.ReactAsync(userId, id, request.IsLike);
        return NoContent();
    }

    [HttpDelete("{id}/react")]
    [Authorize]
    public async Task<IActionResult> RemoveReaction(Guid id)
    {
        var userId = GetRequiredUserId();
        await _collectionService.RemoveReactionAsync(userId, id);
        return NoContent();
    }

    // ─── Comments ─────────────────────────────────────────────────────────────

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<IEnumerable<CollectionCommentDto>>> GetComments(Guid id)
    {
        var result = await _commentService.GetByCollectionAsync(id);
        return Ok(result);
    }

    [HttpGet("{id}/comments/{commentId}/replies")]
    public async Task<ActionResult<IEnumerable<CollectionCommentDto>>> GetReplies(Guid id, Guid commentId)
    {
        var result = await _commentService.GetRepliesAsync(commentId);
        return Ok(result);
    }

    [HttpPost("{id}/comments")]
    [Authorize]
    public async Task<ActionResult<CollectionCommentDto>> AddComment(
        Guid id,
        [FromBody] CreateCollectionCommentRequest request)
    {
        var userId = GetRequiredUserId();
        var result = await _commentService.CreateAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("{id}/comments/{commentId}")]
    [Authorize]
    public async Task<IActionResult> DeleteComment(Guid id, Guid commentId)
    {
        var userId = GetRequiredUserId();
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        var isAdmin = user?.Role >= SekaiLib.Domain.Enums.UserRole.Moderator;
        await _commentService.DeleteAsync(userId, commentId, isAdmin);
        return NoContent();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim, out var id) ? id : null;
    }

    private Guid GetRequiredUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(claim!);
    }

    public record UpdateSectionRequest(string Name);
    public record ReactRequest(bool IsLike);
}
