namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterContentDto(
    Guid Id,
    int ChapterNumber,
    string Name,
    string Content,
    DateTime PublishedAt,
    Guid TitleId,
    string TitleName,
    int? PreviousChapterNumber,
    int? NextChapterNumber
);
