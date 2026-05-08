using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Reports;

public record ReviewReportRequest(ReportStatus Status, string? AdminNote);
