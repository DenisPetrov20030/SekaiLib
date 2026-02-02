using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ReadingList
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    
    // Зовнішній ключ для кастомного списку
    public Guid? UserListId { get; set; } 
    public virtual UserList? UserList { get; set; }
    
    public Guid TitleId { get; set; }
    public virtual Title Title { get; set; } = null!;
    
    public ReadingStatus Status { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public virtual User User { get; set; } = null!;
}