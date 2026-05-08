using SekaiLib.Application.DTOs.Reports;
using SekaiLib.Application.Common;

namespace SekaiLib.Application.Interfaces;

public interface IReportService
{
    Task<ReportDto> CreateAsync(Guid reporterId, CreateReportRequest request);
    Task<PagedResult<ReportDto>> GetAllAsync(int page, int pageSize);
    Task<ReportDto> ReviewAsync(Guid adminId, Guid reportId, ReviewReportRequest request);
}
