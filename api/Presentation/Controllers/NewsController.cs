using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.News;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/news")]
public class NewsController : ControllerBase
{
    private readonly INewsService _newsService;

    public NewsController(INewsService newsService)
    {
        _newsService = newsService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<NewsDto>>> GetPublished(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _newsService.GetPublishedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<PagedResult<NewsDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _newsService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NewsDto>> GetById(Guid id)
    {
        var result = await _newsService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<NewsDto>> Create([FromBody] CreateNewsRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _newsService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<NewsDto>> Update(Guid id, [FromBody] UpdateNewsRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _newsService.UpdateAsync(userId, id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult> Delete(Guid id)
    {
        await _newsService.DeleteAsync(id);
        return NoContent();
    }
}
