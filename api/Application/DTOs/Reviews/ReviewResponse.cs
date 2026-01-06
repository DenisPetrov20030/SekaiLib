using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Reviews;

public record ReviewResponse(
    Guid Id,
    Guid UserId,
    string Username,
    string? AvatarUrl,
    Guid TitleId,
    string Content,
    int Rating,
    int LikesCount,
    int DislikesCount,
    ReactionType? UserReaction,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
