using SekaiLib.Application.DTOs.Messages;

namespace SekaiLib.Application.Interfaces;

public interface IMessagingService
{
    Task<MessageDto> SendDirectMessageAsync(Guid senderId, Guid recipientId, string text);
    Task<IEnumerable<ConversationDto>> GetConversationsAsync(Guid userId);
    Task<IEnumerable<MessageDto>> GetConversationMessagesAsync(Guid userId, Guid conversationId, int skip = 0, int take = 50);
    Task MarkConversationReadAsync(Guid userId, Guid conversationId);
    Task<MessageDto> SendMessageInConversationAsync(Guid userId, Guid conversationId, string text);
    Task DeleteConversationAsync(Guid userId, Guid conversationId);
    Task DeleteMessageAsync(Guid userId, Guid messageId);
    Task<MessageDto> EditMessageAsync(Guid userId, Guid messageId, string newText);
}
