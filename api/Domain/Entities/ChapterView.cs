namespace SekaiLib.Domain.Entities;

public class ChapterView
{
    public Guid Id { get; set; }
    public Guid ChapterId { get; set; }
    public Guid? UserId { get; set; }
    public string IpHash { get; set; } = string.Empty;
    public DateTime ViewedAt { get; set; }
    public Chapter Chapter { get; set; } = null!;
}
