namespace SekaiLib.Application.DTOs.Messages;

public record MessageDto(
    Guid Id,
    Guid ConversationId,
    Guid SenderId,
    string Text,
    DateTime CreatedAt
);
