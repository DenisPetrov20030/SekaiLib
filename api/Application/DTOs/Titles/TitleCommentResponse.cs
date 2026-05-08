using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record TitleCommentResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string? AvatarUrl,
    string Content,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    int LikesCount,
    int DislikesCount,
    ReactionType? UserReaction,
    Guid? ParentCommentId,
    IEnumerable<TitleCommentResponse>? Replies
);
