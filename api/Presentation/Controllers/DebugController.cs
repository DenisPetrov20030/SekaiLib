using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class DebugController : ControllerBase
{
    private readonly ITitleService _titleService;
    private readonly IUnitOfWork _unitOfWork;

    public DebugController(ITitleService titleService, IUnitOfWork unitOfWork)
    {
        _titleService = titleService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("titles-with-publisher")]
    public async Task<IActionResult> GetTitlesWithPublisher()
    {
        // Return minimal info including publisher id via internal repo access would be ideal,
        // but we can reuse existing service GetCatalog to fetch titles and return them.
        var filter = new SekaiLib.Application.DTOs.Titles.CatalogFilterDto(null, null, null, null);
        var result = await _titleService.GetCatalogAsync(filter, 1, 100);

        // Additionally return raw PublisherId info for debugging
        var raw = await _unitOfWork.Titles.GetAllAsync();
        var publishers = raw.Select(t => new { t.Id, t.PublisherId }).ToList();

        return Ok(new { paged = result, publishers });
    }
}
