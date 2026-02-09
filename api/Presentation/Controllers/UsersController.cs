using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Application.DTOs.Users;
using Microsoft.EntityFrameworkCore;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITitleService _titleService;

    public UsersController(IUnitOfWork unitOfWork, ITitleService titleService)
    {
        _unitOfWork = unitOfWork;
        _titleService = titleService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        var userProfile = new UserProfileDto(
            user.Id,
            user.Username,
            user.Email,
            user.AvatarUrl,
            user.CreatedAt
        );

        return Ok(userProfile);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUserProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
        if (user == null)
            return NotFound();

        var userProfile = new UserProfileDto(
            user.Id,
            user.Username,
            user.Email,
            user.AvatarUrl,
            user.CreatedAt
        );

        return Ok(userProfile);
    }

    [HttpGet("{id}/titles")]
    public async Task<ActionResult<PagedResponse<TitleDto>>> GetUserTitles(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _titleService.GetUserTitlesAsync(id, page, pageSize);
        return Ok(result);
    }
    [Authorize]
    [HttpGet("reading-progress")]
    public async Task<ActionResult<IEnumerable<ReadingProgressDto>>> GetReadingProgress()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
        var userId = Guid.Parse(userIdClaim);

        var progresses = await _unitOfWork.UserReadingProgresses
            .Query()
            .Include(p => p.Title)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.LastReadAt)
            .ToListAsync();

        if (progresses.Count == 0) return Ok(Enumerable.Empty<ReadingProgressDto>());

        var latestByTitle = progresses
            .GroupBy(p => p.TitleId)
            .Select(g => g.OrderByDescending(x => x.LastReadAt).First())
            .OrderByDescending(x => x.LastReadAt)
            .ToList();

        var result = new List<ReadingProgressDto>();

        foreach (var progress in latestByTitle)
        {
            var chapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(progress.TitleId, progress.ChapterNumber);
            var totalPages = 0;

            if (chapter != null && !string.IsNullOrWhiteSpace(chapter.Content))
            {
                totalPages = CountTotalPages(chapter.Content);
            }

            // Fallback: минимум – (CurrentPage + 1), учитывая что индекс 0-базовый
            if (totalPages <= 0 || totalPages <= progress.CurrentPage)
            {
                totalPages = Math.Max(progress.CurrentPage + 1, 1);
            }

            result.Add(new ReadingProgressDto(
                progress.TitleId,
                progress.Title!.Name,
                progress.Title.CoverImageUrl ?? "",
                progress.ChapterNumber,
                progress.CurrentPage,
                totalPages
            ));
        }

        return Ok(result);
    }
[Authorize]
[HttpPost("update-progress")]
public async Task<IActionResult> UpdateProgress([FromBody] UpdateProgressRequest request)
{
    var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

    var progress = await _unitOfWork.UserReadingProgresses
        .Query()
        .FirstOrDefaultAsync(p => p.UserId == userId && p.TitleId == request.TitleId);

    if (progress == null)
    {
        progress = new UserReadingProgress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TitleId = request.TitleId
        };
        await _unitOfWork.UserReadingProgresses.AddAsync(progress);
    }

    progress.ChapterNumber = request.ChapterNumber;
    progress.CurrentPage = request.Page;
    progress.LastReadAt = DateTime.UtcNow;

    await _unitOfWork.SaveChangesAsync();
    return Ok();
}

[Authorize]
[HttpDelete("reading-progress")]
public async Task<IActionResult> ClearReadingProgress()
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = Guid.Parse(userIdClaim);

    var progresses = await _unitOfWork.UserReadingProgresses
        .Query()
        .Where(p => p.UserId == userId)
        .ToListAsync();

    if (progresses.Count == 0)
        return NoContent();

    foreach (var p in progresses)
        await _unitOfWork.UserReadingProgresses.DeleteAsync(p);

    await _unitOfWork.SaveChangesAsync();
    return NoContent();
}

[Authorize]
[HttpDelete("reading-progress/{titleId:guid}")]
public async Task<IActionResult> ClearReadingProgressForTitle(Guid titleId)
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = Guid.Parse(userIdClaim);

    var progresses = await _unitOfWork.UserReadingProgresses
        .Query()
        .Where(p => p.UserId == userId && p.TitleId == titleId)
        .ToListAsync();

    if (progresses.Count == 0)
        return NoContent();

    foreach (var p in progresses)
        await _unitOfWork.UserReadingProgresses.DeleteAsync(p);

    await _unitOfWork.SaveChangesAsync();
    return NoContent();
}

    // Вспомогательная логика подсчёта "страниц" как количества непустых абзацев.
    private static int CountTotalPages(string content)
    {
        var lines = content.Split('\n');
        var count = 0;
        foreach (var line in lines)
        {
            if (!string.IsNullOrWhiteSpace(line))
                count++;
        }
        return count;
    }

    // Допоміжний клас для запиту (можна додати в кінець файлу контролера)
    public record UpdateProgressRequest(Guid TitleId, int ChapterNumber, int Page);

}
