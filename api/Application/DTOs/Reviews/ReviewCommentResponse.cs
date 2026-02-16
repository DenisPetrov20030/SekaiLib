namespace SekaiLib.Application.DTOs.Reviews;

using SekaiLib.Domain.Enums;

public record ReviewCommentResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string? AvatarUrl,
    string Content,
    DateTime CreatedAt,
    int LikesCount,
    int DislikesCount,
    ReactionType? UserReaction,
    Guid? ParentCommentId,
    IEnumerable<ReviewCommentResponse>? Replies
);
