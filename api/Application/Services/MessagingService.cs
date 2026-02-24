using Microsoft.AspNetCore.SignalR;
using SekaiLib.Presentation.Hubs;
using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Messages;
using SekaiLib.Application.DTOs.Notifications;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

    public class MessagingService : IMessagingService
    {
        private readonly IHubContext<ChatHub> _hub;
    private readonly IUnitOfWork _uow;
        private readonly INotificationService _notifications;
        public MessagingService(IUnitOfWork uow, IHubContext<ChatHub> hub, INotificationService notifications)
        {
            _uow = uow;
            _hub = hub;
            _notifications = notifications;
        }

    public async Task<MessageDto> SendDirectMessageAsync(Guid senderId, Guid recipientId, string text)
    {
        if (senderId == recipientId) throw new Exception("Неможливо відправити повідомлення самому собі.");

        var conversation = await _uow.Conversations.Query()
            .Include(c => c.Participants)
            .FirstOrDefaultAsync(c => c.Participants.Count == 2 &&
                                      c.Participants.Any(p => p.UserId == senderId) &&
                                      c.Participants.Any(p => p.UserId == recipientId));

        if (conversation == null)
        {
            conversation = new Conversation
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                LastMessageAt = DateTime.UtcNow
            };
            await _uow.Conversations.AddAsync(conversation);

            await _uow.ConversationParticipants.AddAsync(new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                UserId = senderId,
                LastReadAt = DateTime.UtcNow
            });

            await _uow.ConversationParticipants.AddAsync(new ConversationParticipant
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                UserId = recipientId,
                LastReadAt = null
            });
        }

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            SenderId = senderId,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };
        await _uow.Messages.AddAsync(message);

        conversation.LastMessageAt = message.CreatedAt;
        await _uow.SaveChangesAsync();

        var dto = new MessageDto(message.Id, message.ConversationId, message.SenderId, message.Text, message.CreatedAt);

        await _hub.Clients.Group(ChatHub.UserGroup(senderId.ToString())).SendAsync("MessageReceived", dto);
        await _hub.Clients.Group(ChatHub.UserGroup(recipientId.ToString())).SendAsync("MessageReceived", dto);

        var sender = await _uow.Users.GetByIdAsync(senderId);
        if (sender != null)
        {
            await _notifications.CreateAsync(new CreateNotificationRequest(
                recipientId,
                NotificationType.DirectMessage,
                "Нове повідомлення",
                BuildMessagePreview(sender.Username, text),
                $"/messages?conversationId={conversation.Id}",
                senderId
            ));
        }

        return dto;
    }

    public async Task<IEnumerable<ConversationDto>> GetConversationsAsync(Guid userId)
    {
        var conversations = await _uow.Conversations.Query()
            .Include(c => c.Participants)
                .ThenInclude(p => p.User)
            .Include(c => c.Messages)
            .Where(c => c.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();

        var result = new List<ConversationDto>();
        foreach (var c in conversations)
        {
            var other = c.Participants.FirstOrDefault(p => p.UserId != userId);
            var lastMessage = c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            var myParticipant = c.Participants.FirstOrDefault(p => p.UserId == userId);

            int unreadCount = 0;
            if (myParticipant?.LastReadAt == null)
            {
                unreadCount = c.Messages.Count(m => m.SenderId != userId);
            }
            else
            {
                unreadCount = c.Messages.Count(m => m.SenderId != userId && m.CreatedAt > myParticipant.LastReadAt);
            }

            result.Add(new ConversationDto(
                c.Id,
                other?.UserId ?? Guid.Empty,
                other?.User?.Username ?? string.Empty,
                other?.User?.AvatarUrl,
                lastMessage?.Text,
                lastMessage?.SenderId,
                lastMessage?.CreatedAt,
                unreadCount
            ));
        }

        return result;
    }

    public async Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(Guid userId, Guid conversationId, int skip = 0, int take = 50)
    {
        var isParticipant = await _uow.ConversationParticipants.Query()
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId);
        if (!isParticipant) throw new Exception("Доступ заборонено.");

        var messages = await _uow.Messages.Query()
            .Where(m => m.ConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip(skip)
            .Take(take)
            .ToListAsync();

        return messages.Select(m => new MessageDto(m.Id, m.ConversationId, m.SenderId, m.Text, m.CreatedAt));
    }

    public async Task MarkConversationReadAsync(Guid userId, Guid conversationId)
    {
        var participant = await _uow.ConversationParticipants.Query()
            .FirstOrDefaultAsync(p => p.ConversationId == conversationId && p.UserId == userId);
        if (participant == null) throw new Exception("Доступ заборонено.");

        participant.LastReadAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();
    }

    public async Task<MessageDto> SendMessageInConversationAsync(Guid userId, Guid conversationId, string text)
    {
        var isParticipant = await _uow.ConversationParticipants.Query()
            .AnyAsync(p => p.ConversationId == conversationId && p.UserId == userId);
        if (!isParticipant) throw new Exception("Доступ заборонено.");

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderId = userId,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };
        await _uow.Messages.AddAsync(message);

        var conversation = await _uow.Conversations.GetByIdAsync(conversationId);
        if (conversation != null)
        {
            conversation.LastMessageAt = message.CreatedAt;
        }

        await _uow.SaveChangesAsync();

        var dto = new MessageDto(message.Id, message.ConversationId, message.SenderId, message.Text, message.CreatedAt);

        var participantIds = await _uow.ConversationParticipants.Query()
            .Where(p => p.ConversationId == conversationId)
            .Select(p => p.UserId)
            .ToListAsync();

        foreach (var uid in participantIds)
        {
            await _hub.Clients.Group(ChatHub.UserGroup(uid.ToString())).SendAsync("MessageReceived", dto);
        }

        var sender = await _uow.Users.GetByIdAsync(userId);
        if (sender != null)
        {
            foreach (var uid in participantIds.Where(id => id != userId))
            {
                await _notifications.CreateAsync(new CreateNotificationRequest(
                    uid,
                    NotificationType.DirectMessage,
                    "Нове повідомлення",
                    BuildMessagePreview(sender.Username, text),
                    $"/messages?conversationId={conversationId}",
                    userId
                ));
            }
        }

        return dto;
    }

    private static string BuildMessagePreview(string senderUsername, string text)
    {
        var trimmed = text.Trim();
        if (trimmed.Length > 80)
        {
            trimmed = trimmed.Substring(0, 77) + "...";
        }
        return $"{senderUsername}: {trimmed}";
    }

    public async Task DeleteConversationAsync(Guid userId, Guid conversationId)
    {
        var conversation = await _uow.Conversations.Query()
            .Include(c => c.Participants)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId);
        if (conversation == null)
            throw new Exception("Розмову не знайдено.");

        if (!conversation.Participants.Any(p => p.UserId == userId))
            throw new Exception("Доступ заборонено.");

        foreach (var m in conversation.Messages.ToList())
        {
            await _uow.Messages.DeleteAsync(m);
        }

        foreach (var p in conversation.Participants.ToList())
        {
            await _uow.ConversationParticipants.DeleteAsync(p);
        }

        await _uow.Conversations.DeleteAsync(conversation);
        await _uow.SaveChangesAsync();
    }

    public async Task DeleteMessageAsync(Guid userId, Guid messageId)
    {
        var message = await _uow.Messages.Query()
            .Include(m => m.Conversation)
            .FirstOrDefaultAsync(m => m.Id == messageId);
        if (message == null) throw new Exception("Повідомлення не знайдено.");
        if (message.SenderId != userId) throw new Exception("Доступ заборонено.");

        var convId = message.ConversationId;
        await _uow.Messages.DeleteAsync(message);

        var latest = await _uow.Messages.Query()
            .Where(m => m.ConversationId == convId)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefaultAsync();
        var conv = await _uow.Conversations.GetByIdAsync(convId);
        if (conv != null)
        {
            conv.LastMessageAt = latest?.CreatedAt ?? conv.CreatedAt;
        }

        await _uow.SaveChangesAsync();

        var participantIds = await _uow.ConversationParticipants.Query()
            .Where(p => p.ConversationId == convId)
            .Select(p => p.UserId)
            .ToListAsync();
        foreach (var uid in participantIds)
        {
            await _hub.Clients.Group(ChatHub.UserGroup(uid.ToString()))
                .SendAsync("MessageDeleted", new { messageId, conversationId = convId });
        }
    }

    public async Task<MessageDto> EditMessageAsync(Guid userId, Guid messageId, string newText)
    {
        if (string.IsNullOrWhiteSpace(newText)) throw new Exception("Текст не може бути порожнім.");
        var message = await _uow.Messages.GetByIdAsync(messageId);
        if (message == null) throw new Exception("Повідомлення не знайдено.");
        if (message.SenderId != userId) throw new Exception("Доступ заборонено.");

        message.Text = newText.Trim();
        await _uow.SaveChangesAsync();
        var dto = new MessageDto(message.Id, message.ConversationId, message.SenderId, message.Text, message.CreatedAt);

        var participantIds = await _uow.ConversationParticipants.Query()
            .Where(p => p.ConversationId == message.ConversationId)
            .Select(p => p.UserId)
            .ToListAsync();
        foreach (var uid in participantIds)
        {
            await _hub.Clients.Group(ChatHub.UserGroup(uid.ToString()))
                .SendAsync("MessageEdited", dto);
        }

        return dto;
    }
}
