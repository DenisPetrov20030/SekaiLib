namespace SekaiLib.Application.DTOs.Chapters;

public record CreateChapterRequest(
    int ChapterNumber,
    string Name,
    string Content,
    bool IsPremium
);
