using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class TranslationTeamMember
{
    public Guid TeamId { get; set; }
    public Guid UserId { get; set; }
    public TeamMemberRole Role { get; set; }
    public DateTime JoinedAt { get; set; }
    public TranslationTeam Team { get; set; } = null!;
    public User User { get; set; } = null!;
}
