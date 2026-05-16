namespace SekaiLib.Domain.Entities;

public class ForumPost
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public ForumThread Thread { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    /// <summary>Для цитування іншого допису.</summary>
    public Guid? QuotedPostId { get; set; }
    public ForumPost? QuotedPost { get; set; }
    public bool IsEdited { get; set; }
    public bool IsDeleted { get; set; }
    /// <summary>Set to true by auto-moderation; cleared when a moderator approves the post.</summary>
    public bool IsHidden { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<ForumPostReaction> Reactions { get; set; } = new List<ForumPostReaction>();
}
