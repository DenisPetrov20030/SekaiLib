using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Entities;

public class UserReadingProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TitleId { get; set; }
    public int ChapterNumber { get; set; }
    public int CurrentPage { get; set; }
    public DateTime LastReadAt { get; set; }
    public virtual Title? Title { get; set; }
}