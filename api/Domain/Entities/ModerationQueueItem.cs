using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ModerationQueueItem
{
    public Guid Id { get; set; }
    /// <summary>ForumPost | ForumThread | Review | Chapter</summary>
    public string ContentType { get; set; } = string.Empty;
    public Guid ContentId { get; set; }
    /// <summary>Text snapshot at the time of flagging (null for chapters).</summary>
    public string? ContentSnapshot { get; set; }
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    /// <summary>profanity | spam | caps_abuse | chapter_upload</summary>
    public string FlagReason { get; set; } = string.Empty;
    public ModerationStatus Status { get; set; } = ModerationStatus.Pending;
    public string? RejectionReason { get; set; }
    public Guid? ReviewedById { get; set; }
    public User? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
