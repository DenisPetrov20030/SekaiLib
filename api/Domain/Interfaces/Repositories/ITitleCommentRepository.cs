using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface ITitleCommentRepository : IRepository<TitleComment>
{
    Task<IEnumerable<TitleComment>> GetCommentsByTitleIdAsync(Guid titleId);
    Task<TitleComment?> GetCommentByIdAsync(Guid commentId);
    Task AddCommentAsync(TitleComment comment);
    Task RemoveCommentAsync(TitleComment comment);
    Task<TitleCommentReaction?> GetCommentReactionAsync(Guid userId, Guid commentId);
    Task AddCommentReactionAsync(TitleCommentReaction reaction);
    Task RemoveCommentReactionAsync(TitleCommentReaction reaction);
}
