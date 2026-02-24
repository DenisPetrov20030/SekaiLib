using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Notifications;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Presentation.Hubs;

namespace SekaiLib.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<NotificationsHub> _hub;

    public NotificationService(IUnitOfWork unitOfWork, IHubContext<NotificationsHub> hub)
    {
        _unitOfWork = unitOfWork;
        _hub = hub;
    }

    public async Task<NotificationDto> CreateAsync(CreateNotificationRequest request)
    {
        var entity = new Notification
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            ActorUserId = request.ActorUserId,
            TitleId = request.TitleId,
            ChapterId = request.ChapterId,
            Type = request.Type,
            TitleText = request.Title,
            Message = request.Message,
            Link = request.Link,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        var dto = await BuildDto(entity.Id);
        await _hub.Clients.Group(NotificationsHub.UserGroup(request.UserId.ToString()))
            .SendAsync("NotificationReceived", dto);

        return dto;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetForUserAsync(Guid userId, NotificationType? type, int take)
    {
        var query = _unitOfWork.Notifications.Query()
            .Include(n => n.ActorUser)
            .Include(n => n.Title)
            .Where(n => n.UserId == userId);

        if (type.HasValue)
        {
            query = query.Where(n => n.Type == type.Value);
        }

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .ToListAsync();

        return items.Select(Map).ToList();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _unitOfWork.Notifications.Query()
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task MarkReadAsync(Guid userId, Guid notificationId)
    {
        var entity = await _unitOfWork.Notifications.GetByIdAsync(notificationId);
        if (entity == null || entity.UserId != userId)
            return;

        if (!entity.IsRead)
        {
            entity.IsRead = true;
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task MarkAllReadAsync(Guid userId)
    {
        var unread = await _unitOfWork.Notifications.Query()
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        if (unread.Count == 0) return;

        foreach (var item in unread)
        {
            item.IsRead = true;
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<NotificationDto> BuildDto(Guid notificationId)
    {
        var entity = await _unitOfWork.Notifications.Query()
            .Include(n => n.ActorUser)
            .Include(n => n.Title)
            .FirstAsync(n => n.Id == notificationId);

        return Map(entity);
    }

    private static NotificationDto Map(Notification entity)
    {
        return new NotificationDto(
            entity.Id,
            entity.Type,
            entity.TitleText,
            entity.Message,
            entity.Link,
            entity.IsRead,
            entity.CreatedAt,
            entity.ActorUserId,
            entity.ActorUser?.Username,
            entity.ActorUser?.AvatarUrl,
            entity.TitleId,
            entity.Title?.CoverImageUrl
        );
    }
}
