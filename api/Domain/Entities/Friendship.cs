namespace SekaiLib.Domain.Entities;

public class Friendship
{
    public Guid Id { get; set; }
    public Guid UserAId { get; set; }
    public Guid UserBId { get; set; }
    public DateTime CreatedAt { get; set; }

    public User? UserA { get; set; }
    public User? UserB { get; set; }
}
