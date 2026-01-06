using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Common;

public class CatalogFilter
{
    public string? Search { get; set; }
    public Guid? GenreId { get; set; }
    public string? Country { get; set; }
    public TitleStatus? Status { get; set; }
}
