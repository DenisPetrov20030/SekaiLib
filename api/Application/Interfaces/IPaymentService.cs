using SekaiLib.Application.DTOs.Payments;

namespace SekaiLib.Application.Interfaces;

public interface IPaymentService
{
    Task<CreateChapterPaymentResponse> CreateChapterPaymentAsync(Guid userId, Guid chapterId);
    Task HandleLiqPayCallbackAsync(string data, string signature);
    Task<PaymentStatusDto?> GetPaymentStatusAsync(string orderId, Guid userId);
    Task<IEnumerable<PurchaseDto>> GetMyPurchasesAsync(Guid userId);
    Task<bool> HasChapterAccessAsync(Guid userId, Guid chapterId);
    Task SimulateSuccessAsync(string orderId);
    /// <summary>Pulls current status directly from LiqPay API and applies it (fallback when server_url callback was missed).</summary>
    Task<PaymentStatusDto?> RefreshFromLiqPayAsync(string orderId, Guid userId);
}
