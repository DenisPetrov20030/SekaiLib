namespace SekaiLib.Application.DTOs.Forum;

public record ForumCategoryDto(
    Guid Id,
    string Name,
    string? Description,
    string? IconEmoji,
    int SortOrder,
    int ThreadCount,
    int PostCount,
    DateTime? LastPostAt,
    string? LastPostUsername,
    string? LastPostThreadTitle
);

public record ForumThreadDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Title,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    bool IsPinned,
    bool IsLocked,
    int ViewCount,
    int ReplyCount,
    DateTime CreatedAt,
    DateTime LastPostAt,
    string? LastPostUsername
);

public record ForumPostDto(
    Guid Id,
    Guid ThreadId,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    string Content,
    Guid? QuotedPostId,
    string? QuotedPostContent,
    string? QuotedPostAuthorUsername,
    bool IsEdited,
    int LikeCount,
    int DislikeCount,
    bool? UserReaction,   // true = like, false = dislike, null = no reaction
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    bool IsOwn,
    bool CanDelete
);

public record ForumThreadDetailsDto(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string Title,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    bool IsPinned,
    bool IsLocked,
    int ViewCount,
    int ReplyCount,
    DateTime CreatedAt
);

// Requests
public record CreateCategoryRequest(
    string Name,
    string? Description = null,
    string? IconEmoji = null,
    int SortOrder = 0
);

public record UpdateCategoryRequest(
    string Name,
    string? Description = null,
    string? IconEmoji = null,
    int SortOrder = 0,
    bool IsVisible = true
);

public record CreateThreadRequest(
    Guid CategoryId,
    string Title,
    string Content
);

public record CreatePostRequest(
    string Content,
    Guid? QuotedPostId = null
);

public record UpdatePostRequest(string Content);
