namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterDto(
    Guid Id,
    int ChapterNumber,
    string Name,
    DateTime PublishedAt,
    bool IsPremium,
    decimal Price = 0m,
    Guid? TranslationTeamId = null,
    string? TranslationTeamName = null,
    Guid? TitleId = null,
    string? TitleName = null,
    string? TitleCoverImageUrl = null,
    DateTime? EarlyAccessUntil = null,
    int ViewCount = 0
);
