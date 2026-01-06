using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Ratings;
using SekaiLib.Application.Interfaces;
using System.Security.Claims;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/titles/{titleId}/rating")]
public class TitleRatingsController : ControllerBase
{
    private readonly ITitleRatingService _ratingService;

    public TitleRatingsController(ITitleRatingService ratingService)
    {
        _ratingService = ratingService;
    }

    [HttpGet]
    public async Task<ActionResult<TitleRatingResponse>> GetRating(Guid titleId)
    {
        var userId = GetCurrentUserId();
        var rating = await _ratingService.GetRatingAsync(titleId, userId);
        return Ok(rating);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TitleRatingResponse>> SetRating(Guid titleId, SetRatingRequest request)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var rating = await _ratingService.SetRatingAsync(userId.Value, titleId, request.Type);
        return Ok(rating);
    }

    [HttpDelete]
    [Authorize]
    public async Task<ActionResult<TitleRatingResponse>> RemoveRating(Guid titleId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var rating = await _ratingService.RemoveRatingAsync(userId.Value, titleId);
        return Ok(rating);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
