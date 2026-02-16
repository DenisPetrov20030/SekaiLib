using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface IChapterRepository : IRepository<Chapter>
{
    Task<IEnumerable<Chapter>> GetByTitleIdAsync(Guid titleId);
    Task<Chapter?> GetByTitleAndNumberAsync(Guid titleId, int number);

    // Chapter comments
    Task<IEnumerable<ChapterComment>> GetCommentsByChapterIdAsync(Guid chapterId);
    Task<ChapterComment?> GetCommentByIdAsync(Guid commentId);
    Task AddCommentAsync(ChapterComment comment);
    Task<ChapterCommentReaction?> GetCommentReactionAsync(Guid userId, Guid commentId);
    Task AddCommentReactionAsync(ChapterCommentReaction reaction);
    Task RemoveCommentReactionAsync(ChapterCommentReaction reaction);
    Task RemoveCommentAsync(ChapterComment comment);
}
