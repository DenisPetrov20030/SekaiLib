namespace SekaiLib.Application.Interfaces;

public record LiqPayCheckoutParams(
    string Data,
    string Signature,
    string CheckoutUrl
);

public record LiqPayCallbackData(
    string OrderId,
    string Status,
    string? PaymentId,
    decimal Amount,
    string Currency
);

public interface ILiqPayService
{
    LiqPayCheckoutParams CreateCheckout(string orderId, decimal amount, string description);
    bool VerifySignature(string data, string signature);
    LiqPayCallbackData ParseCallback(string data);
    /// <summary>Calls LiqPay status API directly to get current payment status.</summary>
    Task<LiqPayCallbackData?> FetchStatusAsync(string orderId);
}
