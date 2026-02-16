using System;

namespace SekaiLib.Domain.Entities;

public class ChapterComment
{
    public Guid Id { get; set; }
    public Guid ChapterId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Guid? ParentCommentId { get; set; }

    public Chapter Chapter { get; set; } = null!;
    public User User { get; set; } = null!;

    public ICollection<ChapterCommentReaction> Reactions { get; set; } = new List<ChapterCommentReaction>();
    public ChapterComment? ParentComment { get; set; }
    public ICollection<ChapterComment> Replies { get; set; } = new List<ChapterComment>();
}
