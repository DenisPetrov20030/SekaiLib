namespace SekaiLib.Domain.Entities;

public class BadWord
{
    public Guid Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public Guid AddedById { get; set; }
    public User AddedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
