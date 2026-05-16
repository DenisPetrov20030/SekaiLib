namespace SekaiLib.Domain.Entities;

public class CollectionItem
{
    public Guid Id { get; set; }
    public Guid CollectionId { get; set; }
    public Collection Collection { get; set; } = null!;
    public Guid? SectionId { get; set; }
    public CollectionSection? Section { get; set; }
    public Guid TitleId { get; set; }
    public Title Title { get; set; } = null!;
    public int SortOrder { get; set; }
    public DateTime AddedAt { get; set; }
}
