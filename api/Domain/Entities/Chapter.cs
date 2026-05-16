namespace SekaiLib.Domain.Entities;

public class Chapter
{
    public Guid Id { get; set; }
    public Guid TitleId { get; set; }
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public bool IsPremium { get; set; }
    /// <summary>Ціна розділу в UAH. 0 = безкоштовно навіть якщо IsPremium = true.</summary>
    public decimal Price { get; set; }
    /// <summary>True for admin-uploaded chapters. False for team uploads until a moderator approves.</summary>
    public bool IsApproved { get; set; } = true;
    public DateTime? EarlyAccessUntil { get; set; }
    public Guid? TranslationTeamId { get; set; }
    public Title Title { get; set; } = null!;
    public TranslationTeam? TranslationTeam { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
