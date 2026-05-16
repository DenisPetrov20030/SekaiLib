using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class Payment
{
    public Guid Id { get; set; }
    /// <summary>Унікальний ID замовлення для LiqPay (рядок, зазвичай Guid.ToString()).</summary>
    public string OrderId { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    /// <summary>Розділ, за який платять. Null якщо платять за тайтл цілком.</summary>
    public Guid? ChapterId { get; set; }
    public Chapter? Chapter { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "UAH";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    /// <summary>ID платежу від LiqPay (заповнюється з callback).</summary>
    public string? LiqPayPaymentId { get; set; }
    public string? LiqPayStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
