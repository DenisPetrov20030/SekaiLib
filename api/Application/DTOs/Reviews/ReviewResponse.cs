using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Reviews;

public record ReviewResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string? AvatarUrl,
    Guid TitleId,
    string Title,
    string Content,
    int Rating,
    int LikesCount,
    int DislikesCount,
    int ViewCount,
    int CommentsCount,
    ReactionType? UserReaction,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IEnumerable<ReviewCommentResponse> Comments,
    int ReviewerScore
);
