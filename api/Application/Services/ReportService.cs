using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Reports;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ReportDto> CreateAsync(Guid reporterId, CreateReportRequest request)
    {
        var report = new Report
        {
            Id = Guid.NewGuid(),
            ReporterId = reporterId,
            TargetType = request.TargetType,
            TargetId = request.TargetId,
            Reason = request.Reason,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Reports.AddAsync(report);
        await _unitOfWork.SaveChangesAsync();

        var reporter = await _unitOfWork.Users.GetByIdAsync(reporterId);

        return new ReportDto
        {
            Id = report.Id,
            ReporterId = reporterId,
            ReporterUsername = reporter?.Username ?? string.Empty,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            Reason = report.Reason,
            Description = report.Description,
            Status = report.Status,
            CreatedAt = report.CreatedAt
        };
    }

    public async Task<PagedResult<ReportDto>> GetAllAsync(int page, int pageSize)
    {
        var query = _unitOfWork.Reports.Query()
            .Include(r => r.Reporter)
            .Include(r => r.ReviewedByUser)
            .OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var reports = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ReportDto>
        {
            Data = reports.Select(MapToDto),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReportDto> ReviewAsync(Guid adminId, Guid reportId, ReviewReportRequest request)
    {
        var report = await _unitOfWork.Reports.Query()
            .Include(r => r.Reporter)
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == reportId)
            ?? throw new NotFoundException("Report", reportId);

        report.Status = request.Status;
        report.AdminNote = request.AdminNote;
        report.ReviewedByUserId = adminId;
        report.ReviewedAt = DateTime.UtcNow;

        await _unitOfWork.Reports.UpdateAsync(report);
        await _unitOfWork.SaveChangesAsync();

        var admin = await _unitOfWork.Users.GetByIdAsync(adminId);
        report.ReviewedByUser = admin;

        return MapToDto(report);
    }

    private static ReportDto MapToDto(Report r) => new()
    {
        Id = r.Id,
        ReporterId = r.ReporterId,
        ReporterUsername = r.Reporter.Username,
        TargetType = r.TargetType,
        TargetId = r.TargetId,
        Reason = r.Reason,
        Description = r.Description,
        Status = r.Status,
        AdminNote = r.AdminNote,
        ReviewedByUserId = r.ReviewedByUserId,
        ReviewedByUsername = r.ReviewedByUser?.Username,
        ReviewedAt = r.ReviewedAt,
        CreatedAt = r.CreatedAt
    };
}
