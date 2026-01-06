using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record UpdateTitleRequest(
    string Name,
    string Author,
    string Description,
    string? CoverImageUrl,
    TitleStatus Status,
    string CountryOfOrigin,
    List<Guid> GenreIds
);
