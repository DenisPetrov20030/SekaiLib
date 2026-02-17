using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.Interfaces;
using System.Security.Claims;

namespace SekaiLib.Presentation.Controllers;

[Authorize]
[ApiController]
[Route("api/messages")] 
public class MessagesController : ControllerBase
{
    private readonly IMessagingService _service;
    public MessagesController(IMessagingService service)
    {
        _service = service;
    }

    [HttpPost("to/{recipientId:guid}")]
    public async Task<IActionResult> SendTo(Guid recipientId, [FromBody] SendMessageRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var message = await _service.SendDirectMessageAsync(userId, recipientId, request.Text);
        return Ok(message);
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var conversations = await _service.GetConversationsAsync(userId);
        return Ok(conversations);
    }

    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid id, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var messages = await _service.GetConversationMessagesAsync(userId, id, skip, take);
        return Ok(messages);
    }

    [HttpPost("conversations/{id:guid}/messages")]
    public async Task<IActionResult> SendInConversation(Guid id, [FromBody] SendMessageRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var message = await _service.SendMessageInConversationAsync(userId, id, request.Text);
        return Ok(message);
    }

    [HttpPost("conversations/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.MarkConversationReadAsync(userId, id);
        return Ok();
    }

    [HttpDelete("conversations/{id:guid}")]
    public async Task<IActionResult> DeleteConversation(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.DeleteConversationAsync(userId, id);
        return NoContent();
    }

    [HttpDelete("messages/{id:guid}")]
    public async Task<IActionResult> DeleteMessage(Guid id)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _service.DeleteMessageAsync(userId, id);
        return NoContent();
    }

    public record EditMessageRequest(string Text);
    [HttpPut("messages/{id:guid}")]
    public async Task<IActionResult> EditMessage(Guid id, [FromBody] EditMessageRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var updated = await _service.EditMessageAsync(userId, id, request.Text);
        return Ok(updated);
    }
}

public record SendMessageRequest(string Text);
