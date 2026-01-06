using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class ReadingList
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid TitleId { get; set; }
    public ReadingStatus Status { get; set; }
    public DateTime AddedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public User User { get; set; } = null!;
    public Title Title { get; set; } = null!;
}
