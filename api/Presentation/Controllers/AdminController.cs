using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Administrator,Moderator")]
public class AdminController : ControllerBase
{
    private readonly ITitleService _titleService;
    private readonly IChapterService _chapterService;

    public AdminController(ITitleService titleService, IChapterService chapterService)
    {
        _titleService = titleService;
        _chapterService = chapterService;
    }

    [HttpPost("titles")]
    public async Task<ActionResult<TitleDetailResponse>> CreateTitle(CreateTitleRequest request)
    {
        var title = await _titleService.CreateAsync(request);
        return CreatedAtAction(nameof(TitlesController.GetById), "Titles", new { id = title.Id }, title);
    }

    [HttpPut("titles/{id}")]
    public async Task<ActionResult<TitleDetailResponse>> UpdateTitle(Guid id, UpdateTitleRequest request)
    {
        var title = await _titleService.UpdateAsync(id, request);
        return Ok(title);
    }

    [HttpDelete("titles/{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult> DeleteTitle(Guid id)
    {
        await _titleService.DeleteAsync(id);
        return NoContent();
    }
}
