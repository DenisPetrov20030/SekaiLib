using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterCommentResponse(
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
    IEnumerable<ChapterCommentResponse>? Replies
);
