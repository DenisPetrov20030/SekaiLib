using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Notifications;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;
using System.Security.Claims;

namespace SekaiLib.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetAll([
        FromQuery] NotificationType? type,
        [FromQuery] int take = 50)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var list = await _service.GetForUserAsync(userId, type, take);
        return Ok(list);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult> GetUnreadCount()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var count = await _service.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.MarkReadAsync(userId, id);
        return Ok();
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.MarkAllReadAsync(userId);
        return Ok();
    }
}
