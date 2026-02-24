using SekaiLib.Application.DTOs.Notifications;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Interfaces;

public interface INotificationService
{
    Task<NotificationDto> CreateAsync(CreateNotificationRequest request);
    Task<IReadOnlyList<NotificationDto>> GetForUserAsync(Guid userId, NotificationType? type, int take);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkReadAsync(Guid userId, Guid notificationId);
    Task MarkAllReadAsync(Guid userId);
}
