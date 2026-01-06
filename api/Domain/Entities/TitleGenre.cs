namespace SekaiLib.Domain.Entities;

public class TitleGenre
{
    public Guid TitleId { get; set; }
    public Guid GenreId { get; set; }
    public Title Title { get; set; } = null!;
    public Genre Genre { get; set; } = null!;
}
