using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.ReadingLists;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReadingListsController : ControllerBase
{
    private readonly IReadingListService _readingListService;

    public ReadingListsController(IReadingListService readingListService)
    {
        _readingListService = readingListService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReadingListDto>>> GetUserLists()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var lists = await _readingListService.GetUserListsAsync(userId);
        return Ok(lists);
    }

    [HttpPost]
    public async Task<ActionResult> AddToList([FromBody] UpdateReadingStatusRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _readingListService.AddToListAsync(userId, request.TitleId, request.Status);
        return Ok();
    }

    [HttpPut("{titleId}")]
    public async Task<ActionResult> UpdateStatus(Guid titleId, [FromBody] UpdateReadingStatusRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _readingListService.UpdateStatusAsync(userId, titleId, request.Status);
        return Ok();
    }

    [HttpDelete("{titleId}")]
    public async Task<ActionResult> RemoveFromList(Guid titleId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _readingListService.RemoveFromListAsync(userId, titleId);
        return NoContent();
    }
}
