namespace SekaiLib.Domain.Entities;

public class UserWarning
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid IssuedById { get; set; }
    public User IssuedBy { get; set; } = null!;
    public string Reason { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
