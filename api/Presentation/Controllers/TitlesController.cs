using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TitlesController : ControllerBase
{
    private readonly ITitleService _titleService;
    private readonly IChapterService _chapterService;

    public TitlesController(ITitleService titleService, IChapterService chapterService)
    {
        _titleService = titleService;
        _chapterService = chapterService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResponse<TitleDto>>> GetCatalog(
        [FromQuery] string? search,
        [FromQuery] Guid? genreId,
        [FromQuery] string? country,
        [FromQuery] TitleStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filter = new CatalogFilterDto(search, genreId, country, status);
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
        var chapter = await _chapterService.GetChapterContentByNumberAsync(titleId, chapterNumber);
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
}
