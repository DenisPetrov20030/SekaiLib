using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Reports;

public record CreateReportRequest(
    ReportTargetType TargetType,
    Guid TargetId,
    string Reason,
    string? Description);
