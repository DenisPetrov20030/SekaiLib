namespace SekaiLib.Application.DTOs.Payments;

public record CreateChapterPaymentResponse(
    string OrderId,
    string Data,
    string Signature,
    string CheckoutUrl,
    decimal Amount,
    string ChapterName
);

// Status is returned as a string ("Pending", "Success", "Sandbox", "Failure", "Reversed")
// so the frontend can compare without knowing the underlying integer values.
public record PaymentStatusDto(
    string OrderId,
    string Status,
    decimal Amount,
    DateTime CreatedAt,
    DateTime? CompletedAt
);

public record PurchaseDto(
    Guid Id,
    Guid? ChapterId,
    string? ChapterName,
    int? ChapterNumber,
    string? TitleName,
    decimal AmountPaid,
    DateTime PurchasedAt
);
