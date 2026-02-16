using SekaiLib.Application.DTOs.Reviews;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<ReviewResponse>> GetByTitleAsync(Guid titleId, Guid? currentUserId);
    Task<ReviewResponse> CreateAsync(Guid userId, Guid titleId, CreateReviewRequest request);
    Task<ReviewResponse> UpdateAsync(Guid userId, Guid reviewId, UpdateReviewRequest request);
    Task DeleteAsync(Guid userId, Guid reviewId, bool isAdmin);
    Task<ReviewResponse> SetReactionAsync(Guid userId, Guid reviewId, ReactionType type);
    Task RemoveReactionAsync(Guid userId, Guid reviewId);
    Task<ReviewCommentResponse> AddCommentAsync(Guid userId, Guid reviewId, CreateReviewCommentRequest request);
    Task<ReviewCommentResponse> UpdateCommentAsync(Guid userId, Guid commentId, UpdateReviewCommentRequest request);
    Task<ReviewCommentResponse> SetCommentReactionAsync(Guid userId, Guid commentId, ReactionType type);
    Task RemoveCommentReactionAsync(Guid userId, Guid commentId);
    Task DeleteCommentAsync(Guid userId, Guid commentId, bool isAdmin);
}
