using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record CatalogFilterDto(string? Search, Guid? GenreId, string? Country, TitleStatus? Status);
