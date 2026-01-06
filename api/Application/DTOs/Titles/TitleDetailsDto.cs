using SekaiLib.Domain.Enums;
using SekaiLib.Application.DTOs.Chapters;

namespace SekaiLib.Application.DTOs.Titles;

public record TitleDetailsDto(
    Guid Id,
    string Name,
    string Author,
    string Description,
    string CoverImageUrl,
    TitleStatus Status,
    string CountryOfOrigin,
    IEnumerable<GenreDto> Genres,
    IEnumerable<TranslationTeamDto> TranslationTeams,
    IEnumerable<ChapterDto> Chapters
);
