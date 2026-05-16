namespace SekaiLib.Domain.Entities;

public class ForumThread
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public ForumCategory Category { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public bool IsPinned { get; set; }
    public bool IsLocked { get; set; }
    /// <summary>Set to true by auto-moderation; cleared when a moderator approves the thread.</summary>
    public bool IsHidden { get; set; }
    public int ViewCount { get; set; }
    public int ReplyCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>UTC-дата останньої відповіді (або CreatedAt якщо відповідей немає).</summary>
    public DateTime LastPostAt { get; set; } = DateTime.UtcNow;
    public Guid? LastPostUserId { get; set; }
    public User? LastPostUser { get; set; }

    public ICollection<ForumPost> Posts { get; set; } = new List<ForumPost>();
}
