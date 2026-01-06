using Microsoft.AspNetCore.Mvc;
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
}
