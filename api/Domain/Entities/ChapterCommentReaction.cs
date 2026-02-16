using System;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ChapterCommentReaction
{
    public Guid Id { get; set; }
    public Guid CommentId { get; set; }
    public Guid UserId { get; set; }
    public ReactionType Type { get; set; }
    public DateTime CreatedAt { get; set; }

    public ChapterComment Comment { get; set; } = null!;
    public User User { get; set; } = null!;
}
