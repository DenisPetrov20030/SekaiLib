namespace SekaiLib.Domain.Entities;

public class Collection
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public bool IsPublic { get; set; } = true;
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CollectionSection> Sections { get; set; } = new List<CollectionSection>();
    public ICollection<CollectionItem> Items { get; set; } = new List<CollectionItem>();
    public ICollection<CollectionComment> Comments { get; set; } = new List<CollectionComment>();
    public ICollection<CollectionReaction> Reactions { get; set; } = new List<CollectionReaction>();
}
