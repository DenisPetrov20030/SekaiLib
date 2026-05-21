namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterContentDto(
    Guid Id,
    int ChapterNumber,
    string Name,
    string Content,
    DateTime PublishedAt,
    Guid TitleId,
    string TitleName,
    Guid? TranslationTeamId,
    string? TranslationTeamName,
    int? PreviousChapterNumber,
    int? NextChapterNumber,
    int ViewCount = 0,
    bool IsPremium = false,
    bool IsLocked = false,
    decimal Price = 0m,
    DateTime? EarlyAccessUntil = null
);
