using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record TitleDto(
    Guid Id,
    string Name,
    string Author,
    string CoverImageUrl,
    string Description,
    string CountryOfOrigin,
    TitleStatus Status,
    int TitlesCount 
);
