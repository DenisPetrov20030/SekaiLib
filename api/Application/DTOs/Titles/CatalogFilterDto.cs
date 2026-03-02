using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record CatalogFilterDto(string? Search, List<Guid>? GenreIds, string? Country, TitleStatus? Status);
