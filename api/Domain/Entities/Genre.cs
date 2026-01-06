namespace SekaiLib.Domain.Entities;

public class Genre
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public ICollection<TitleGenre> TitleGenres { get; set; } = new List<TitleGenre>();
}
