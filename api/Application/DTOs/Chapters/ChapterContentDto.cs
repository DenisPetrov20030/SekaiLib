namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterContentDto(
    Guid Id,
    int Number,
    string Name,
    string Content,
    DateTime PublishedAt,
    Guid TitleId,
    string TitleName
);
