namespace SekaiLib.Domain.Entities;

public class Chapter
{
    public Guid Id { get; set; }
    public Guid TitleId { get; set; }
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public bool IsPremium { get; set; }
    public DateTime? EarlyAccessUntil { get; set; }
    public Title Title { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
