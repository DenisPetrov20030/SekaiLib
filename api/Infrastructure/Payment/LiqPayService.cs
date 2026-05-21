using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<LiqPayService> _logger;

    public LiqPayService(IOptions<LiqPayOptions> options, HttpClient http, ILogger<LiqPayService> logger)
    {
        _options = options.Value;
        _http = http;
        _logger = logger;
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
        try
        {
            // Захист: якщо ключі не налаштовані в appsettings або використовуються шаблони від Git,
            // повертаємо емуляцію пісочниці, щоб API не падало під час локальних тестів.
            if (string.IsNullOrEmpty(_options.PublicKey) || _options.PublicKey.Contains("YOUR_"))
            {
                _logger.LogWarning("LiqPay keys are not configured properly. Falling back to sandbox emulation.");
                return new LiqPayCallbackData(orderId, "sandbox", null, 0m, "UAH");
            }

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
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"LiqPay API request failed with status code: {response.StatusCode}");
                return null;
            }

            var body = await response.Content.ReadAsStringAsync();
            _logger.LogInformation($"LiqPay raw response for order {orderId}: {body}");

            // Безпечний розбір сирого JSON від сервера LiqPay
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            if (root.TryGetProperty("status", out var st) && (st.GetString() == "error" || st.GetString() == "failure"))
            {
                var errCode = root.TryGetProperty("err_code", out var code) ? code.GetString() : null;
                var errDesc = root.TryGetProperty("err_description", out var desc) ? desc.GetString() : "Unknown LiqPay error";

                if (errCode == "payment_not_found")
                {
                    _logger.LogInformation($"LiqPay: order {orderId} not yet registered on LiqPay side (payment_not_found) — treating as still pending");
                    return null;
                }

                _logger.LogError($"LiqPay returned error status for order {orderId}: {errDesc}");
            }

            return new LiqPayCallbackData(
                OrderId: root.TryGetProperty("order_id", out var oid) ? oid.GetString()! : orderId,
                Status: root.TryGetProperty("status", out var statusProp) ? statusProp.GetString()! : "error",
                PaymentId: root.TryGetProperty("payment_id", out var pid) ? pid.GetRawText() : null,
                Amount: root.TryGetProperty("amount", out var amt) ? amt.GetDecimal() : 0m,
                Currency: root.TryGetProperty("currency", out var cur) ? cur.GetString()! : "UAH"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Critical exception during FetchStatusAsync for order {orderId}");
            return new LiqPayCallbackData(orderId, "error", null, 0m, "UAH");
        }
    }

    private string BuildSignature(string data)
    {
        var raw = _options.PrivateKey + data + _options.PrivateKey;
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToBase64String(hash);
    }
}