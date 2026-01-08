using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Chapters;
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
}
