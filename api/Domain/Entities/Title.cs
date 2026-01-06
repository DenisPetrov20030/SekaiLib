using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class Title
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public TitleStatus Status { get; set; }
    public string CountryOfOrigin { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    public ICollection<TitleGenre> TitleGenres { get; set; } = new List<TitleGenre>();
    public ICollection<TitleTranslator> TitleTranslators { get; set; } = new List<TitleTranslator>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<TitleRating> Ratings { get; set; } = new List<TitleRating>();
}
