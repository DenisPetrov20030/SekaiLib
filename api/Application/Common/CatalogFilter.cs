using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Common;

public class CatalogFilter
{
    public string? Search { get; set; }
    public List<Guid>? GenreIds { get; set; }
    /// <summary>Жанри, які потрібно виключити з результатів (фільтр контенту користувача).</summary>
    public List<Guid>? ExcludeGenreIds { get; set; }
    public string? Country { get; set; }
    public TitleStatus? Status { get; set; }
}
