using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class TitleRating
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TitleId { get; set; }
    public ReactionType Type { get; set; }
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
    public Title Title { get; set; } = null!;
}
