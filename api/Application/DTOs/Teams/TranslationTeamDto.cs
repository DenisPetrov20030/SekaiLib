namespace SekaiLib.Application.DTOs.Teams;

public record TranslationTeamDto(
    Guid Id,
    string Name,
    string Description,
    string? AvatarUrl,
    string? CoverImageUrl,
    Guid OwnerId,
    string OwnerUsername,
    int MemberCount,
    int ChapterCount,
    int TitleCount,
    int SubscriberCount,
    DateTime CreatedAt
);
