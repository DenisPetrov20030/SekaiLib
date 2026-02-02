using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

[Authorize]
[ApiController]
[Route("api/[controller]")]
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

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var list = await _service.GetUserListByIdAsync(userId, id);
        if (list == null) return NotFound();
        return Ok(list);
    }
}