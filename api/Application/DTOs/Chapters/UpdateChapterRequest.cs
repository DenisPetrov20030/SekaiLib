namespace SekaiLib.Application.DTOs.Chapters;

public record UpdateChapterRequest(
    int ChapterNumber,
    string Name,
    string Content,
    bool IsPremium
);
