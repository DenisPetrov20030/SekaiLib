namespace SekaiLib.Domain.Entities;

public class TranslationTeam
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public ICollection<TitleTranslator> TitleTranslators { get; set; } = new List<TitleTranslator>();
}
