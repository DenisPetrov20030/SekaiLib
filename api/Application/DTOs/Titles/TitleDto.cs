using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record TitleDto(
    Guid Id,
    string Name,
    string Author,
    string Description,
    string CoverImageUrl,
    TitleStatus Status,
    int ChapterCount
);
