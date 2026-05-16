using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Domain.Enums;
using SekaiLib.Infrastructure.Persistence;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "Administrator")]
public class AdminPaymentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminPaymentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminPaymentDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var query = _db.Payments
            .Include(p => p.User)
            .Include(p => p.Chapter).ThenInclude(c => c != null ? c.Title : null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PaymentStatus>(status, true, out var s))
            query = query.Where(p => p.Status == s);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                p.OrderId.Contains(search) ||
                p.User.Username.Contains(search) ||
                (p.LiqPayPaymentId != null && p.LiqPayPaymentId.Contains(search)));

        query = query.OrderByDescending(p => p.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var data = items.Select(p => new AdminPaymentDto(
            p.Id,
            p.OrderId,
            p.UserId,
            p.User.Username,
            p.User.AvatarUrl,
            p.ChapterId,
            p.Chapter?.Number,
            p.Chapter?.Name,
            p.Chapter?.Title?.Name,
            p.Amount,
            p.Currency,
            p.Status.ToString(),
            p.LiqPayPaymentId,
            p.LiqPayStatus,
            p.CreatedAt,
            p.CompletedAt
        )).ToList();

        return Ok(new PagedResult<AdminPaymentDto>
        {
            Data = data,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
        });
    }

    [HttpPost("{orderId}/refresh")]
    public async Task<IActionResult> RefreshStatus(string orderId,
        [FromServices] Application.Interfaces.IPaymentService paymentService)
    {
        var payment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
        if (payment == null) return NotFound();

        var result = await paymentService.RefreshFromLiqPayAsync(orderId, payment.UserId);
        return Ok(result);
    }
}

public record AdminPaymentDto(
    Guid Id,
    string OrderId,
    Guid UserId,
    string Username,
    string? AvatarUrl,
    Guid? ChapterId,
    int? ChapterNumber,
    string? ChapterName,
    string? TitleName,
    decimal Amount,
    string Currency,
    string Status,
    string? LiqPayPaymentId,
    string? LiqPayStatus,
    DateTime CreatedAt,
    DateTime? CompletedAt
);
