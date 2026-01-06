namespace SekaiLib.Domain.Entities;

public class TitleTranslator
{
    public Guid TitleId { get; set; }
    public Guid TranslationTeamId { get; set; }
    public Title Title { get; set; } = null!;
    public TranslationTeam TranslationTeam { get; set; } = null!;
}
