namespace SekaiLib.Application.DTOs.Collections;

public record CollectionItemDto(
    Guid Id,
    Guid TitleId,
    string TitleName,
    string? CoverImageUrl,
    int SortOrder
);

public record CollectionSectionDto(
    Guid Id,
    string Name,
    int SortOrder,
    IEnumerable<CollectionItemDto> Items
);

public record CollectionDto(
    Guid Id,
    string Title,
    string? Description,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    bool IsPublic,
    int ViewCount,
    int CommentCount,
    int TitleCount,
    int LikeCount,
    int DislikeCount,
    string[] CoverImages,
    DateTime CreatedAt
);

public record CollectionDetailsDto(
    Guid Id,
    string Title,
    string? Description,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    bool IsPublic,
    int ViewCount,
    int CommentCount,
    int LikeCount,
    int DislikeCount,
    bool? UserReaction,
    IEnumerable<CollectionSectionDto> Sections,
    IEnumerable<CollectionItemDto> UncategorizedItems,
    DateTime CreatedAt
);

public record CollectionCommentDto(
    Guid Id,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    string Content,
    Guid? ParentCommentId,
    int ReplyCount,
    DateTime CreatedAt
);

public record CreateCollectionRequest(string Title, string? Description, bool IsPublic = true);
public record UpdateCollectionRequest(string Title, string? Description, bool IsPublic);
public record AddSectionRequest(string Name);
public record AddCollectionItemRequest(Guid TitleId, Guid? SectionId);
public record CreateCollectionCommentRequest(string Content, Guid? ParentCommentId);
