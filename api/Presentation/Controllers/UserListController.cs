using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SekaiLib.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/userlists")]
public class UserListsController : ControllerBase
{
    private readonly UserListService _service;
    public UserListsController(UserListService service) => _service = service;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] string name)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.CreateListAsync(userId, name);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetMyLists()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var lists = await _service.GetUserListsAsync(userId);
        return Ok(lists);
    }

    [AllowAnonymous]
    [HttpGet("by-user/{userId:guid}")]
    public async Task<IActionResult> GetListsByUser(Guid userId)
    {
        var lists = await _service.GetUserListsAsync(userId);
        return Ok(lists);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var list = await _service.GetUserListByIdAsync(userId, id);
        if (list == null) return NotFound();
        return Ok(list);
    }

    // Публічний перегляд кастомного списку за id (без прив'язки до власника)
    [AllowAnonymous]
    [HttpGet("public/{id:guid}")]
    public async Task<IActionResult> GetPublic(Guid id)
    {
        var list = await _service.GetUserListByIdPublicAsync(id);
        if (list == null) return NotFound();
        return Ok(list);
    }
}