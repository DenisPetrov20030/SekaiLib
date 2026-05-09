using SekaiLib.Application.DTOs.Reports;
using SekaiLib.Application.Common;

namespace SekaiLib.Application.Interfaces;

public interface IReportService
{
    Task<ReportDto> CreateAsync(Guid reporterId, CreateReportRequest request);
    Task<PagedResult<ReportDto>> GetAllAsync(int page, int pageSize);
    Task<ReportDto> GetByIdAsync(Guid reportId);
    Task<PagedResult<ReportDto>> GetReviewedAsync(int page = 1, int pageSize = 20);
    Task DeleteAsync(Guid reportId);
    Task<ReportDto> ReviewAsync(Guid adminId, Guid reportId, ReviewReportRequest request);
}
