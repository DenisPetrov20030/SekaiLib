namespace SekaiLib.Domain.Entities;

public class TitleComment
{
    public Guid Id { get; set; }
    public Guid TitleId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public Guid? ParentCommentId { get; set; }

    public Title Title { get; set; } = null!;
    public User User { get; set; } = null!;

    public ICollection<TitleCommentReaction> Reactions { get; set; } = new List<TitleCommentReaction>();
    public TitleComment? ParentComment { get; set; }
    public ICollection<TitleComment> Replies { get; set; } = new List<TitleComment>();
}
