using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Entities;

public class UserList
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public virtual ICollection<ReadingList> ReadingListItems { get; set; } = new List<ReadingList>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}