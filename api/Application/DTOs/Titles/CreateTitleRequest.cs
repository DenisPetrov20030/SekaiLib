using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record CreateTitleRequest(
    string Name,
    string Author,
    string Description,
    string? CoverImageUrl,
    TitleStatus Status,
    string CountryOfOrigin,
    List<Guid> GenreIds
);
