using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text.Json;
using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TitlesController : ControllerBase
{
    private readonly ITitleService _titleService;
    private readonly IChapterService _chapterService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebHostEnvironment _environment;

    public TitlesController(ITitleService titleService, IChapterService chapterService, IUnitOfWork unitOfWork, IWebHostEnvironment environment)
    {
        _titleService = titleService;
        _chapterService = chapterService;
        _unitOfWork = unitOfWork;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TitleDto>>> GetCatalog(
        [FromQuery] string? search,
        [FromQuery] List<Guid>? genreIds,
        [FromQuery] string? country,
        [FromQuery] TitleStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        List<Guid>? excludeGenreIds = null;

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user != null && !string.IsNullOrEmpty(user.BlockedGenres))
            {
                try
                {
                    excludeGenreIds = JsonSerializer.Deserialize<List<Guid>>(user.BlockedGenres);
                }
                catch { }
            }
        }

        var filter = new CatalogFilterDto(search, genreIds, country, status, excludeGenreIds);
        var result = await _titleService.GetCatalogAsync(filter, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TitleDetailsDto>> GetById(Guid id)
    {
        var title = await _titleService.GetByIdAsync(id);
        return Ok(title);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<TitleDto>>> Search([FromQuery] string query)
    {
        var titles = await _titleService.SearchAsync(query);
        return Ok(titles);
    }

    [HttpGet("{titleId}/chapters/{chapterNumber:int}/content")]
    public async Task<ActionResult<ChapterContentDto>> GetChapterContent(Guid titleId, int chapterNumber)
    {
        Guid? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var parsedId))
            userId = parsedId;

        var chapter = await _chapterService.GetChapterContentByNumberAsync(titleId, chapterNumber, userId);
        return Ok(chapter);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TitleDetailsDto>> Create([FromBody] CreateTitleRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var title = await _titleService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { id = title.Id }, title);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<TitleDetailsDto>> Update(Guid id, [FromBody] UpdateTitleRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var title = await _titleService.UpdateAsync(userId, id, request);
        return Ok(title);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _titleService.DeleteAsync(userId, id);
        return NoContent();
    }
    [HttpGet("latest")]
    public async Task<ActionResult<IEnumerable<TitleDto>>> GetLatestTitles()
    {
        var titles = await _titleService.GetLatestTitlesAsync(10);
        return Ok(titles);
    }

    [HttpGet("latest-chapters")]
    public async Task<ActionResult<IEnumerable<LatestChapterDto>>> GetLatestChapters()
    {
        var chapters = await _chapterService.GetLatestChaptersAsync(15);
        return Ok(chapters);
    }

    [HttpPost("upload-cover")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<object>> UploadCover(IFormFile cover)
    {
        if (cover == null || cover.Length == 0)
            return BadRequest("Файл не вибрано.");

        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        var ext = Path.GetExtension(cover.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest("Підтримуються лише PNG/JPG/JPEG/WEBP.");

        // Allow up to 50 MB (should match server/nginx limits)
        if (cover.Length > 50 * 1024 * 1024)
            return BadRequest("Максимальний розмір файлу — 50 МБ.");

        var uploadsRoot = Path.Combine(_environment.ContentRootPath, "uploads", "covers");
        if (!Directory.Exists(uploadsRoot)) Directory.CreateDirectory(uploadsRoot);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsRoot, fileName);
        using var stream = System.IO.File.Create(filePath);
        await cover.CopyToAsync(stream);

        return Ok(new { url = $"/uploads/covers/{fileName}" });
    }
}
