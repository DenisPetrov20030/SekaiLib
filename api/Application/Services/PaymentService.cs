using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SekaiLib.Application.DTOs.Payments;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILiqPayService _liqPay;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(IUnitOfWork unitOfWork, ILiqPayService liqPay, ILogger<PaymentService> logger)
    {
        _unitOfWork = unitOfWork;
        _liqPay = liqPay;
        _logger = logger;
    }

    public async Task<CreateChapterPaymentResponse> CreateChapterPaymentAsync(Guid userId, Guid chapterId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId)
            ?? throw new NotFoundException("Chapter", chapterId);

        if (chapter.Price <= 0)
            throw new ValidationException("Price", "Цей розділ безкоштовний.");

        // Вже придбано?
        var alreadyPurchased = await HasChapterAccessAsync(userId, chapterId);
        if (alreadyPurchased)
            throw new ValidationException("Purchase", "Ви вже придбали цей розділ.");

        var title = await _unitOfWork.Titles.GetByIdAsync(chapter.TitleId);
        var description = $"Розділ {chapter.Number}: {chapter.Name}" +
                          (title != null ? $" ({title.Name})" : "");

        var orderId = Guid.NewGuid().ToString("N");

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            UserId = userId,
            ChapterId = chapterId,
            Amount = chapter.Price,
            Currency = "UAH",
            Status = PaymentStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Payments.AddAsync(payment);
        await _unitOfWork.SaveChangesAsync();

        var checkout = _liqPay.CreateCheckout(orderId, chapter.Price, description);

        _logger.LogInformation(
            "Створено платіж {OrderId} для користувача {UserId}, розділ {ChapterId}, сума {Amount} UAH",
            orderId, userId, chapterId, chapter.Price);

        return new CreateChapterPaymentResponse(
            orderId,
            checkout.Data,
            checkout.Signature,
            checkout.CheckoutUrl,
            chapter.Price,
            chapter.Name
        );
    }

    public async Task HandleLiqPayCallbackAsync(string data, string signature)
    {
        if (!_liqPay.VerifySignature(data, signature))
        {
            _logger.LogWarning("LiqPay callback: невалідний підпис");
            return;
        }

        LiqPayCallbackData cb;
        try { cb = _liqPay.ParseCallback(data); }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LiqPay callback: не вдалося розпарсити data");
            return;
        }

        _logger.LogInformation(
            "LiqPay callback: orderId={OrderId}, status={Status}", cb.OrderId, cb.Status);

        var payment = await _unitOfWork.Payments.Query()
            .FirstOrDefaultAsync(p => p.OrderId == cb.OrderId);

        if (payment == null)
        {
            _logger.LogWarning("LiqPay callback: платіж {OrderId} не знайдено", cb.OrderId);
            return;
        }

        // Ідемпотентність — не обробляти двічі
        if (payment.Status == PaymentStatus.Success || payment.Status == PaymentStatus.Sandbox)
        {
            _logger.LogInformation("LiqPay callback: {OrderId} вже успішно оброблено", cb.OrderId);
            return;
        }

        payment.LiqPayStatus = cb.Status;
        payment.LiqPayPaymentId = cb.PaymentId;
        payment.CompletedAt = DateTime.UtcNow;

        var isSuccess = cb.Status is "success" or "sandbox";

        if (isSuccess)
        {
            payment.Status = cb.Status == "sandbox" ? PaymentStatus.Sandbox : PaymentStatus.Success;

            // Надаємо доступ до контенту
            if (payment.ChapterId.HasValue)
            {
                var purchase = new UserPurchase
                {
                    Id = Guid.NewGuid(),
                    UserId = payment.UserId,
                    ChapterId = payment.ChapterId.Value,
                    PaymentId = payment.Id,
                    PurchasedAt = DateTime.UtcNow
                };

                await _unitOfWork.UserPurchases.AddAsync(purchase);
                _logger.LogInformation(
                    "Користувач {UserId} успішно придбав розділ {ChapterId}", payment.UserId, payment.ChapterId);
            }
        }
        else if (cb.Status == "reversed")
        {
            payment.Status = PaymentStatus.Reversed;
            // Відкликаємо доступ у разі повернення коштів
            var purchase = await _unitOfWork.UserPurchases.Query()
                .FirstOrDefaultAsync(p => p.PaymentId == payment.Id);
            if (purchase != null)
                await _unitOfWork.UserPurchases.DeleteAsync(purchase);
        }
        else
        {
            payment.Status = PaymentStatus.Failure;
        }

        await _unitOfWork.Payments.UpdateAsync(payment);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PaymentStatusDto?> GetPaymentStatusAsync(string orderId, Guid userId)
    {
        var payment = await _unitOfWork.Payments.Query()
            .FirstOrDefaultAsync(p => p.OrderId == orderId && p.UserId == userId);

        return payment == null ? null : new PaymentStatusDto(
            payment.OrderId, payment.Status.ToString(), payment.Amount, payment.CreatedAt, payment.CompletedAt);
    }

    public async Task<IEnumerable<PurchaseDto>> GetMyPurchasesAsync(Guid userId)
    {
        var purchases = await _unitOfWork.UserPurchases.Query()
            .Include(p => p.Payment)
            .Include(p => p.Chapter)
                .ThenInclude(c => c != null ? c.Title : null)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.PurchasedAt)
            .ToListAsync();

        return purchases.Select(p => new PurchaseDto(
            p.Id,
            p.ChapterId,
            p.Chapter?.Name,
            p.Chapter?.Number,
            p.Chapter?.Title?.Name,
            p.Payment.Amount,
            p.PurchasedAt
        ));
    }

    public async Task<bool> HasChapterAccessAsync(Guid userId, Guid chapterId)
    {
        return await _unitOfWork.UserPurchases.Query()
            .AnyAsync(p => p.UserId == userId && p.ChapterId == chapterId);
    }

    public async Task<PaymentStatusDto?> RefreshFromLiqPayAsync(string orderId, Guid userId)
    {
        var payment = await _unitOfWork.Payments.Query()
            .FirstOrDefaultAsync(p => p.OrderId == orderId && p.UserId == userId);

        if (payment == null) return null;

        // Термінальні статуси — відразу повертаємо актуальний стейт без повторного запиту
        if (payment.Status == PaymentStatus.Success || payment.Status == PaymentStatus.Sandbox
            || payment.Status == PaymentStatus.Failure || payment.Status == PaymentStatus.Reversed)
        {
            return new PaymentStatusDto(payment.OrderId, payment.Status.ToString(),
                payment.Amount, payment.CreatedAt, payment.CompletedAt);
        }

        var cb = await _liqPay.FetchStatusAsync(orderId);
        if (cb == null)
        {
            _logger.LogWarning("RefreshFromLiqPay: LiqPay API returned null for {OrderId}", orderId);
            return new PaymentStatusDto(payment.OrderId, payment.Status.ToString(),
                payment.Amount, payment.CreatedAt, payment.CompletedAt);
        }

        _logger.LogInformation("RefreshFromLiqPay: {OrderId} → {Status}", orderId, cb.Status);

        payment.LiqPayStatus = cb.Status;
        payment.LiqPayPaymentId = cb.PaymentId;
        payment.CompletedAt = DateTime.UtcNow;

        var isSuccess = cb.Status is "success" or "sandbox";
        if (isSuccess)
        {
            payment.Status = cb.Status == "sandbox" ? PaymentStatus.Sandbox : PaymentStatus.Success;

            var alreadyPurchased = await _unitOfWork.UserPurchases.Query()
                .AnyAsync(p => p.PaymentId == payment.Id);

            if (!alreadyPurchased && payment.ChapterId.HasValue)
            {
                await _unitOfWork.UserPurchases.AddAsync(new UserPurchase
                {
                    Id = Guid.NewGuid(),
                    UserId = payment.UserId,
                    ChapterId = payment.ChapterId.Value,
                    PaymentId = payment.Id,
                    PurchasedAt = DateTime.UtcNow
                });
                _logger.LogInformation("RefreshFromLiqPay: Надано доступ до розділу {ChapterId} для користувача {UserId}", payment.ChapterId, payment.UserId);
            }
        }
        // Якщо повернулася помилка або платіж відхилено шлюзом
        else if (cb.Status is "error" or "failure" || cb.Status.Contains("err_"))
        {
            payment.Status = PaymentStatus.Failure;
        }
        else if (cb.Status == "reversed")
        {
            payment.Status = PaymentStatus.Reversed;
            var purchase = await _unitOfWork.UserPurchases.Query()
                .FirstOrDefaultAsync(p => p.PaymentId == payment.Id);
            if (purchase != null)
                await _unitOfWork.UserPurchases.DeleteAsync(purchase);
        }
        // Інші статуси на кшталт "processing" або "prepared" залишають транзакцію в Pending

        await _unitOfWork.Payments.UpdateAsync(payment);
        await _unitOfWork.SaveChangesAsync();

        return new PaymentStatusDto(payment.OrderId, payment.Status.ToString(),
            payment.Amount, payment.CreatedAt, payment.CompletedAt);
    }

    public async Task SimulateSuccessAsync(string orderId)
    {
        var payment = await _unitOfWork.Payments.Query()
            .FirstOrDefaultAsync(p => p.OrderId == orderId);

        if (payment == null)
            throw new NotFoundException($"Payment with orderId {orderId} was not found");

        if (payment.Status == PaymentStatus.Success || payment.Status == PaymentStatus.Sandbox)
        {
            _logger.LogInformation("SimulateSuccess: {OrderId} вже оброблено", orderId);
            return;
        }

        payment.Status = PaymentStatus.Sandbox;
        payment.LiqPayStatus = "sandbox";
        payment.CompletedAt = DateTime.UtcNow;

        if (payment.ChapterId.HasValue)
        {
            var purchase = new UserPurchase
            {
                Id = Guid.NewGuid(),
                UserId = payment.UserId,
                ChapterId = payment.ChapterId.Value,
                PaymentId = payment.Id,
                PurchasedAt = DateTime.UtcNow
            };

            await _unitOfWork.UserPurchases.AddAsync(purchase);
            _logger.LogInformation(
                "SimulateSuccess: користувач {UserId} отримав доступ до розділу {ChapterId}",
                payment.UserId, payment.ChapterId);
        }

        await _unitOfWork.Payments.UpdateAsync(payment);
        await _unitOfWork.SaveChangesAsync();
    }
}