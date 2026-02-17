namespace SekaiLib.Application.DTOs.Messages;

public record ConversationDto(
    Guid Id,
    Guid OtherUserId,
    string OtherUsername,
    string? OtherAvatarUrl,
    string? LastMessageText,
    Guid? LastMessageSenderId,
    DateTime? LastMessageAt,
    int UnreadCount
);
