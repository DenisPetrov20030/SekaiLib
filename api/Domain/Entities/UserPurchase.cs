namespace SekaiLib.Domain.Entities;

/// <summary>Запис про придбаний розділ (або тайтл цілком).</summary>
public class UserPurchase
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    /// <summary>Куплений розділ. Null якщо куплено тайтл цілком.</summary>
    public Guid? ChapterId { get; set; }
    public Chapter? Chapter { get; set; }
    public Guid PaymentId { get; set; }
    public Payment Payment { get; set; } = null!;
    public DateTime PurchasedAt { get; set; }
}
