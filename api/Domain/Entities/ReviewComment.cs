namespace SekaiLib.Domain.Entities;

public class ReviewComment
{
    public Guid Id { get; set; }
    public Guid ReviewId { get; set; }
    public Guid? ParentCommentId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Review Review { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<ReviewCommentReaction> Reactions { get; set; } = new List<ReviewCommentReaction>();
    public ReviewComment? ParentComment { get; set; }
    public ICollection<ReviewComment> Replies { get; set; } = new List<ReviewComment>();
}
