namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterDto(
    Guid Id,
    int ChapterNumber,
    string Name,
    DateTime PublishedAt,
    bool IsPremium,
    Guid? TranslationTeamId = null,
    string? TranslationTeamName = null,
    int ViewCount = 0
);
