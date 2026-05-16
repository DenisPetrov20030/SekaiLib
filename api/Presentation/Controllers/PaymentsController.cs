using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Payments;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>Ініціювати оплату розділу.</summary>
    [HttpPost("chapter-payment")]
    [Authorize]
    public async Task<ActionResult<CreateChapterPaymentResponse>> CreateChapterPayment(
        [FromBody] CreateChapterPaymentRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _paymentService.CreateChapterPaymentAsync(userId, request.ChapterId);
        return Ok(result);
    }

    /// <summary>LiqPay серверний callback (без авторизації).</summary>
    [HttpPost("liqpay/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> LiqPayCallback([FromForm] string data, [FromForm] string signature)
    {
        await _paymentService.HandleLiqPayCallbackAsync(data, signature);
        return Ok();
    }

    /// <summary>Отримати статус платежу за orderId.</summary>
    [HttpGet("status/{orderId}")]
    [Authorize]
    public async Task<ActionResult<PaymentStatusDto>> GetPaymentStatus(string orderId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var status = await _paymentService.GetPaymentStatusAsync(orderId, userId);
        if (status == null)
            return NotFound();
        return Ok(status);
    }

    /// <summary>Список придбаних розділів поточного користувача.</summary>
    [HttpGet("my-purchases")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<PurchaseDto>>> GetMyPurchases()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var purchases = await _paymentService.GetMyPurchasesAsync(userId);
        return Ok(purchases);
    }

    /// <summary>Перевірка доступу до розділу.</summary>
    [HttpGet("access/{chapterId}")]
    [Authorize]
    public async Task<ActionResult<ChapterAccessDto>> CheckAccess(Guid chapterId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var hasAccess = await _paymentService.HasChapterAccessAsync(userId, chapterId);
        return Ok(new ChapterAccessDto(chapterId, hasAccess));
    }

#if DEBUG
    /// <summary>Dev-only: симуляція успішного платежу (sandbox тест).</summary>
    [HttpPost("dev/simulate/{orderId}")]
    [AllowAnonymous]
    public async Task<IActionResult> SimulateSuccess(string orderId)
    {
        await _paymentService.SimulateSuccessAsync(orderId);
        return Ok(new { message = $"Платіж {orderId} симульовано як success." });
    }
#endif
}

public record CreateChapterPaymentRequest(Guid ChapterId);
public record ChapterAccessDto(Guid ChapterId, bool HasAccess);
