using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Ratings;
using SekaiLib.Application.DTOs.Reviews;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;
using System.Security.Claims;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/titles/{titleId}/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReviewResponse>>> GetByTitle(Guid titleId)
    {
        var userId = GetCurrentUserId();
        var reviews = await _reviewService.GetByTitleAsync(titleId, userId);
        return Ok(reviews);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> Create(Guid titleId, CreateReviewRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var review = await _reviewService.CreateAsync(userId.Value, titleId, request);
        return CreatedAtAction(nameof(GetByTitle), new { titleId }, review);
    }

    [HttpPut("{reviewId}")]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> Update(Guid titleId, Guid reviewId, UpdateReviewRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var review = await _reviewService.UpdateAsync(userId.Value, reviewId, request);
        return Ok(review);
    }

    [HttpDelete("{reviewId}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid titleId, Guid reviewId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var isAdmin = User.IsInRole(UserRole.Administrator.ToString()) || User.IsInRole(UserRole.Moderator.ToString());
        await _reviewService.DeleteAsync(userId.Value, reviewId, isAdmin);
        return NoContent();
    }

    [HttpPost("{reviewId}/reactions")]
    [Authorize]
    public async Task<ActionResult<ReviewResponse>> SetReaction(Guid titleId, Guid reviewId, [FromBody] SetRatingRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var review = await _reviewService.SetReactionAsync(userId.Value, reviewId, request.Type);
        return Ok(review);
    }

    [HttpDelete("{reviewId}/reactions")]
    [Authorize]
    public async Task<ActionResult> RemoveReaction(Guid titleId, Guid reviewId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        await _reviewService.RemoveReactionAsync(userId.Value, reviewId);
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
