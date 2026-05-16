namespace SekaiLib.Domain.Entities;

public class ForumPostReaction
{
    public Guid PostId { get; set; }
    public ForumPost Post { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public bool IsLike { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
