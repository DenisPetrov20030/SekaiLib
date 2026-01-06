using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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
    public async Task<ActionResult<TitleDetailsDto>> CreateTitle([FromBody] CreateTitleRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _titleService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(TitlesController.GetById), "Titles", new { id = result.Id }, result);
    }

    [HttpPut("titles/{id}")]
    public async Task<ActionResult<TitleDetailsDto>> UpdateTitle(Guid id, [FromBody] UpdateTitleRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _titleService.UpdateAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("titles/{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult> DeleteTitle(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _titleService.DeleteAsync(userId, id);
        return NoContent();
    }
}
