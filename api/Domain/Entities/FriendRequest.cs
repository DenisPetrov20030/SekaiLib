using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class FriendRequest
{
    public Guid Id { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public FriendRequestStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User? FromUser { get; set; }
    public User? ToUser { get; set; }
}
