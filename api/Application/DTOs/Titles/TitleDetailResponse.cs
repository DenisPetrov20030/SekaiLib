using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record TitleDetailResponse(
    Guid Id,
    string Title,
    string? OriginalTitle,
    string? Description,
    string? CoverUrl,
    TitleStatus Status,
    int? Year,
    List<GenreDto> Genres,
    int ChaptersCount,
    int LikesCount,
    int DislikesCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
