using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Faq;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/faq")]
public class FaqController : ControllerBase
{
    private readonly IFaqService _faqService;

    public FaqController(IFaqService faqService)
    {
        _faqService = faqService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FaqItemDto>>> GetPublished()
    {
        var result = await _faqService.GetPublishedAsync();
        return Ok(result);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<IEnumerable<FaqItemDto>>> GetAll()
    {
        var result = await _faqService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<FaqItemDto>> Create([FromBody] CreateFaqItemRequest request)
    {
        var result = await _faqService.CreateAsync(request);
        return CreatedAtAction(nameof(GetPublished), null, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<FaqItemDto>> Update(Guid id, [FromBody] UpdateFaqItemRequest request)
    {
        var result = await _faqService.UpdateAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _faqService.DeleteAsync(id);
        return NoContent();
    }
}
