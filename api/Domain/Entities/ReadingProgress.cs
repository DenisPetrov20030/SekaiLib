namespace SekaiLib.Domain.Entities;

public class ReadingProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ChapterId { get; set; }
    public DateTime LastReadAt { get; set; }
    public int ProgressPercentage { get; set; }
    public User User { get; set; } = null!;
    public Chapter Chapter { get; set; } = null!;
}
