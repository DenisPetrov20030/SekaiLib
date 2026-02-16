using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface IReviewRepository : IRepository<Review>
{
    Task<IEnumerable<Review>> GetByTitleIdAsync(Guid titleId);
    Task<Review?> GetByUserAndTitleAsync(Guid userId, Guid titleId);
    Task<ReviewReaction?> GetReactionAsync(Guid userId, Guid reviewId);
    Task AddReactionAsync(ReviewReaction reaction);
    Task RemoveReactionAsync(ReviewReaction reaction);
    Task<IEnumerable<ReviewComment>> GetCommentsByReviewIdAsync(Guid reviewId);
    Task AddCommentAsync(ReviewComment comment);
    Task<ReviewComment?> GetCommentByIdAsync(Guid commentId);
    Task RemoveCommentAsync(ReviewComment comment);
    Task<ReviewCommentReaction?> GetCommentReactionAsync(Guid userId, Guid commentId);
    Task AddCommentReactionAsync(ReviewCommentReaction reaction);
    Task RemoveCommentReactionAsync(ReviewCommentReaction reaction);
}
