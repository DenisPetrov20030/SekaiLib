using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? ActorUserId { get; set; }
    public User? ActorUser { get; set; }

    public Guid? TitleId { get; set; }
    public Title? Title { get; set; }

    public Guid? ChapterId { get; set; }
    public Chapter? Chapter { get; set; }

    public NotificationType Type { get; set; }
    public string TitleText { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}
