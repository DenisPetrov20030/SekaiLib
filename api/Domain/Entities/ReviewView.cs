namespace SekaiLib.Domain.Entities;

public class ReviewView
{
    public Guid Id { get; set; }
    public Guid ReviewId { get; set; }
    public Guid? UserId { get; set; }
    public string IpHash { get; set; } = string.Empty;
    public DateTime ViewedAt { get; set; }
    public Review Review { get; set; } = null!;
}
