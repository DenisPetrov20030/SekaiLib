namespace SekaiLib.Domain.Entities;

public class Review
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TitleId { get; set; }
    public string ReviewTitle { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int Rating { get; set; }
    public int ViewCount { get; set; }
    /// <summary>Set to true by auto-moderation; cleared when a moderator approves the review.</summary>
    public bool IsHidden { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public User User { get; set; } = null!;
    public Title Title { get; set; } = null!;
    public ICollection<ReviewReaction> Reactions { get; set; } = new List<ReviewReaction>();
    public ICollection<ReviewComment> Comments { get; set; } = new List<ReviewComment>();
}
