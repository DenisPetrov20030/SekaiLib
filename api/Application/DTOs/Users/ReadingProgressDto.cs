namespace SekaiLib.Application.DTOs.Users;

public record ReadingProgressDto(
    Guid TitleId,
    string TitleName,
    string CoverImageUrl,
    int ChapterNumber,
    int CurrentPage,
    int TotalPages
);