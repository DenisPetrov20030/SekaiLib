using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Notifications;

public record CreateNotificationRequest(
    Guid UserId,
    NotificationType Type,
    string Title,
    string Message,
    string? Link,
    Guid? ActorUserId = null,
    Guid? TitleId = null,
    Guid? ChapterId = null
);
