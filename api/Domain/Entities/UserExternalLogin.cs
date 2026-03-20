namespace SekaiLib.Domain.Entities;

public class UserExternalLogin
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public User User { get; set; } = null!;
}
