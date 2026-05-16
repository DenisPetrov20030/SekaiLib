using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Payments;

public record CreateChapterPaymentResponse(
    string OrderId,
    string Data,
    string Signature,
    string CheckoutUrl,
    decimal Amount,
    string ChapterName
);

public record PaymentStatusDto(
    string OrderId,
    PaymentStatus Status,
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
