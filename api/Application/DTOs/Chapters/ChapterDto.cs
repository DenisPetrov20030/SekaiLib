namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterDto(
    Guid Id,
    int ChapterNumber,
    string Name,
    DateTime PublishedAt,
    bool IsPremium,
    Guid? TranslationTeamId = null,
    string? TranslationTeamName = null,
    Guid? TitleId = null,
    string? TitleName = null,
    string? TitleCoverImageUrl = null,
    int ViewCount = 0
);
