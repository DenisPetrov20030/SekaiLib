namespace SekaiLib.Domain.Entities;

public class CollectionComment
{
    public Guid Id { get; set; }
    public Guid CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public Guid? ParentCommentId { get; set; }
    public CollectionComment? ParentComment { get; set; }
    public ICollection<CollectionComment> Replies { get; set; } = new List<CollectionComment>();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
