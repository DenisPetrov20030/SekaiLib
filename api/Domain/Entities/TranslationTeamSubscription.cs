namespace SekaiLib.Domain.Entities;

public class TranslationTeamSubscription
{
    public Guid TeamId { get; set; }
    public Guid UserId { get; set; }
    public DateTime SubscribedAt { get; set; }
    public TranslationTeam Team { get; set; } = null!;
    public User User { get; set; } = null!;
}
