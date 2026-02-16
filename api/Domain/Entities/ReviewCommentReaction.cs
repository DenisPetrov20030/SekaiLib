using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ReviewCommentReaction
{
    public Guid Id { get; set; }
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public ReactionType Type { get; set; }
    public DateTime CreatedAt { get; set; }

    public ReviewComment Comment { get; set; } = null!;
    public User User { get; set; } = null!;
}
