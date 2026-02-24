using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Notifications;

public record NotificationDto(
    Guid Id,
    NotificationType Type,
    string Title,
    string Message,
    string? Link,
    bool IsRead,
    DateTime CreatedAt,
    Guid? ActorUserId,
    string? ActorUsername,
    string? ActorAvatarUrl,
    Guid? TitleId,
    string? TitleCoverImageUrl
);
