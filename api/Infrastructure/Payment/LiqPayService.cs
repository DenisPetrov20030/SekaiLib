using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Options;

namespace SekaiLib.Infrastructure.Payments;

public class LiqPayService : ILiqPayService
{
    private const string CheckoutUrl = "https://www.liqpay.ua/api/3/checkout";
    private const string ApiUrl = "https://www.liqpay.ua/api/request";
    private readonly LiqPayOptions _options;
    private readonly HttpClient _http;

    public LiqPayService(IOptions<LiqPayOptions> options, HttpClient http)
    {
        _options = options.Value;
        _http = http;
    }

    public LiqPayCheckoutParams CreateCheckout(string orderId, decimal amount, string description)
    {
        var payload = new Dictionary<string, object>
        {
            ["version"] = 3,
            ["public_key"] = _options.PublicKey,
            ["action"] = "pay",
            ["amount"] = amount,
            ["currency"] = "UAH",
            ["description"] = description,
            ["order_id"] = orderId,
            ["server_url"] = _options.ServerCallbackUrl,
            ["result_url"] = $"{_options.FrontendResultUrl}?orderId={orderId}",
        };

        if (_options.IsSandbox)
            payload["sandbox"] = 1;

        var json = JsonSerializer.Serialize(payload);
        var data = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
        var signature = BuildSignature(data);

        return new LiqPayCheckoutParams(data, signature, CheckoutUrl);
    }

    public bool VerifySignature(string data, string signature)
    {
        var expected = BuildSignature(data);
        return string.Equals(expected, signature, StringComparison.Ordinal);
    }

    public LiqPayCallbackData ParseCallback(string data)
    {
        var json = Encoding.UTF8.GetString(Convert.FromBase64String(data));
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        return new LiqPayCallbackData(
            OrderId: root.GetProperty("order_id").GetString()!,
            Status: root.GetProperty("status").GetString()!,
            PaymentId: root.TryGetProperty("payment_id", out var pid) ? pid.GetRawText() : null,
            Amount: root.TryGetProperty("amount", out var amt) ? amt.GetDecimal() : 0m,
            Currency: root.TryGetProperty("currency", out var cur) ? cur.GetString()! : "UAH"
        );
    }

    public async Task<LiqPayCallbackData?> FetchStatusAsync(string orderId)
    {
        var payload = new Dictionary<string, object>
        {
            ["version"] = 3,
            ["public_key"] = _options.PublicKey,
            ["action"] = "status",
            ["order_id"] = orderId,
        };

        var json = JsonSerializer.Serialize(payload);
        var data = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
        var signature = BuildSignature(data);

        var form = new FormUrlEncodedContent([
            new KeyValuePair<string, string>("data", data),
            new KeyValuePair<string, string>("signature", signature),
        ]);

        var response = await _http.PostAsync(ApiUrl, form);
        if (!response.IsSuccessStatusCode) return null;

        var body = await response.Content.ReadAsStringAsync();
        try { return ParseCallback(Convert.ToBase64String(Encoding.UTF8.GetBytes(body))); }
        catch
        {
            // LiqPay returns raw JSON here, not base64
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            return new LiqPayCallbackData(
                OrderId: root.TryGetProperty("order_id", out var oid) ? oid.GetString()! : orderId,
                Status: root.TryGetProperty("status", out var st) ? st.GetString()! : "error",
                PaymentId: root.TryGetProperty("payment_id", out var pid) ? pid.GetRawText() : null,
                Amount: root.TryGetProperty("amount", out var amt) ? amt.GetDecimal() : 0m,
                Currency: root.TryGetProperty("currency", out var cur) ? cur.GetString()! : "UAH"
            );
        }
    }

    private string BuildSignature(string data)
    {
        var raw = _options.PrivateKey + data + _options.PrivateKey;
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToBase64String(hash);
    }
}
