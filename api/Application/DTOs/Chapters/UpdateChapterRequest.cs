namespace SekaiLib.Application.DTOs.Chapters;

public record UpdateChapterRequest(
    int ChapterNumber,
    string Name,
    string Content,
    bool IsPremium,
    decimal Price = 0m,
    Guid? TranslationTeamId = null,
    DateTime? EarlyAccessUntil = null
);
