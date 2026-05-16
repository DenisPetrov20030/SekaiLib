using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ModerationLog
{
    public Guid Id { get; set; }
    public Guid ModeratorId { get; set; }
    public User Moderator { get; set; } = null!;
    public ModerationAction Action { get; set; }
    public string? TargetType { get; set; }
    public Guid? TargetId { get; set; }
    /// <summary>Human-readable detail (e.g. username, reason, content snippet).</summary>
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
