using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ReviewReaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ReviewId { get; set; }
    public ReactionType Type { get; set; }
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
    public Review Review { get; set; } = null!;
}
