using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class TranslationTeam
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public ICollection<TitleTranslator> TitleTranslators { get; set; } = new List<TitleTranslator>();
    public ICollection<TranslationTeamMember> Members { get; set; } = new List<TranslationTeamMember>();
    public ICollection<TranslationTeamSubscription> Subscriptions { get; set; } = new List<TranslationTeamSubscription>();
    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
}
