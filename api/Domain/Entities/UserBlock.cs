namespace SekaiLib.Domain.Entities;

public class UserBlock
{
    public Guid Id { get; set; }
    public Guid BlockerId { get; set; }
    public User Blocker { get; set; } = null!;
    public Guid BlockedUserId { get; set; }
    public User BlockedUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
