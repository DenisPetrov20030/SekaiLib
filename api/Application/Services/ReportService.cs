using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Reports;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Infrastructure.Persistence;

namespace SekaiLib.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _dbContext;

    public ReportService(IUnitOfWork unitOfWork, AppDbContext dbContext)
    {
        _unitOfWork = unitOfWork;
        _dbContext = dbContext;
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

        var targetInfo = await ResolveTargetUserAsync(report.TargetType, report.TargetId);

        return new ReportDto
        {
            Id = report.Id,
            ReporterId = reporterId,
            ReporterUsername = reporter?.Username ?? string.Empty,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            TargetUserId = targetInfo?.UserId,
            TargetUsername = targetInfo?.Username,
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
        var targetInfos = await ResolveTargetUsersAsync(reports);

        return new PagedResult<ReportDto>
        {
            Data = reports.Select(r => MapToDto(r, targetInfos.TryGetValue(r.Id, out var info) ? info : null)),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ReportDto> GetByIdAsync(Guid reportId)
    {
        var report = await _unitOfWork.Reports.Query()
            .Include(r => r.Reporter)
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == reportId)
            ?? throw new NotFoundException("Report", reportId);

        var targetInfo = await ResolveTargetUserAsync(report.TargetType, report.TargetId);
        return MapToDto(report, targetInfo);
    }

    public async Task<PagedResult<ReportDto>> GetReviewedAsync(int page = 1, int pageSize = 20)
    {
        var query = _unitOfWork.Reports.Query()
            .Include(r => r.Reporter)
            .Include(r => r.ReviewedByUser)
            .Where(r => r.Status == ReportStatus.Reviewed)
            .OrderByDescending(r => r.ReviewedAt);

        var total = await query.CountAsync();
        var reports = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var targetInfos = await ResolveTargetUsersAsync(reports);

        return new PagedResult<ReportDto>
        {
            Data = reports.Select(r => MapToDto(r, targetInfos.TryGetValue(r.Id, out var info) ? info : null)),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task DeleteAsync(Guid reportId)
    {
        var report = await _unitOfWork.Reports.GetByIdAsync(reportId)
            ?? throw new NotFoundException("Report", reportId);

        await _unitOfWork.Reports.DeleteAsync(report);
        await _unitOfWork.SaveChangesAsync();
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

        var targetInfo = await ResolveTargetUserAsync(report.TargetType, report.TargetId);
        return MapToDto(report, targetInfo);
    }

    private async Task<Dictionary<Guid, TargetUserInfo?>> ResolveTargetUsersAsync(IEnumerable<Report> reports)
    {
        var result = new Dictionary<Guid, TargetUserInfo?>();
        foreach (var report in reports)
        {
            result[report.Id] = await ResolveTargetUserAsync(report.TargetType, report.TargetId);
        }

        return result;
    }

    private async Task<TargetUserInfo?> ResolveTargetUserAsync(ReportTargetType targetType, Guid targetId)
    {
        return targetType switch
        {
            ReportTargetType.User => await GetUserInfoAsync(targetId),
            ReportTargetType.Review => await ResolveUserInfoFromIdAsync(
                await _dbContext.Reviews
                    .Where(x => x.Id == targetId)
                    .Select(x => x.UserId)
                    .FirstOrDefaultAsync()),
            ReportTargetType.ReviewComment => await ResolveUserInfoFromIdAsync(
                await _dbContext.ReviewComments
                    .Where(x => x.Id == targetId)
                    .Select(x => x.UserId)
                    .FirstOrDefaultAsync()),
            ReportTargetType.ChapterComment => await ResolveUserInfoFromIdAsync(
                await _dbContext.ChapterComments
                    .Where(x => x.Id == targetId)
                    .Select(x => x.UserId)
                    .FirstOrDefaultAsync()),
            ReportTargetType.Title => await ResolveUserInfoFromIdAsync(
                await _dbContext.Titles
                    .Where(x => x.Id == targetId)
                    .Select(x => x.PublisherId)
                    .FirstOrDefaultAsync()),
            ReportTargetType.TitleComment => await ResolveUserInfoFromIdAsync(
                await _dbContext.TitleComments
                    .Where(x => x.Id == targetId)
                    .Select(x => x.UserId)
                    .FirstOrDefaultAsync()),
            _ => null
        };
    }

    private async Task<TargetUserInfo?> ResolveUserInfoFromIdAsync(Guid userId)
    {
        return userId == Guid.Empty ? null : await GetUserInfoAsync(userId);
    }

    private async Task<TargetUserInfo?> GetUserInfoAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        return user is null ? null : new TargetUserInfo(user.Id, user.Username);
    }

    private static ReportDto MapToDto(Report r, TargetUserInfo? targetInfo) => new()
    {
        Id = r.Id,
        ReporterId = r.ReporterId,
        ReporterUsername = r.Reporter.Username,
        TargetType = r.TargetType,
        TargetId = r.TargetId,
        TargetUserId = targetInfo?.UserId,
        TargetUsername = targetInfo?.Username,
        Reason = r.Reason,
        Description = r.Description,
        Status = r.Status,
        AdminNote = r.AdminNote,
        ReviewedByUserId = r.ReviewedByUserId,
        ReviewedByUsername = r.ReviewedByUser?.Username,
        ReviewedAt = r.ReviewedAt,
        CreatedAt = r.CreatedAt
    };

    private sealed record TargetUserInfo(Guid UserId, string Username);
}
