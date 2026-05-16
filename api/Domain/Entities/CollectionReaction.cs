namespace SekaiLib.Domain.Entities;

/// <summary>Реакція (лайк/дизлайк) на колекцію. Composite PK: CollectionId + UserId.</summary>
public class CollectionReaction
{
    public Guid CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public bool IsLike { get; set; }
    public DateTime CreatedAt { get; set; }
}
