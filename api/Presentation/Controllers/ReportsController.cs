using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Reports;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReportDto>> Create([FromBody] CreateReportRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _reportService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetAll), null, result);
    }

    [HttpGet]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<PagedResult<ReportDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _reportService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpPut("{reportId}/review")]
    [Authorize(Roles = "Administrator,Moderator")]
    public async Task<ActionResult<ReportDto>> Review(Guid reportId, [FromBody] ReviewReportRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _reportService.ReviewAsync(adminId, reportId, request);
        return Ok(result);
    }
}
