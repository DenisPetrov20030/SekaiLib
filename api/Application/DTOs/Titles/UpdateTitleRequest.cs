using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record UpdateTitleRequest(
    string Title,
    string? OriginalTitle,
    string? Description,
    string? CoverUrl,
    TitleStatus Status,
    int? Year,
    List<Guid> GenreIds
);
