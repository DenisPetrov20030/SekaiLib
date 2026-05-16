namespace SekaiLib.Domain.Entities;

public class CollectionSection
{
    public Guid Id { get; set; }
    public Guid CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<CollectionItem> Items { get; set; } = new List<CollectionItem>();
}
