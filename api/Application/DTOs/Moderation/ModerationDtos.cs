using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Moderation;

// ── Queue ────────────────────────────────────────────────────────────────────

public record ModerationQueueItemDto(
    Guid Id,
    string ContentType,
    Guid ContentId,
    string? ContentSnapshot,
    Guid AuthorId,
    string AuthorUsername,
    string? AuthorAvatarUrl,
    string FlagReason,
    ModerationStatus Status,
    string? RejectionReason,
    Guid? ReviewedById,
    string? ReviewedByUsername,
    DateTime? ReviewedAt,
    DateTime CreatedAt
);

public record RejectQueueItemRequest(string? Reason);

// ── Logs ─────────────────────────────────────────────────────────────────────

public record ModerationLogDto(
    Guid Id,
    Guid ModeratorId,
    string ModeratorUsername,
    string? ModeratorAvatarUrl,
    ModerationAction Action,
    string? TargetType,
    Guid? TargetId,
    string? Details,
    DateTime CreatedAt
);

// ── Stats ────────────────────────────────────────────────────────────────────

public record ModerationStatsDto(
    int PendingQueueCount,
    int PendingReportCount,
    int ActiveBanCount,
    int TotalWarningsToday
);

// ── Warnings ─────────────────────────────────────────────────────────────────

public record UserWarningDto(
    Guid Id,
    Guid UserId,
    string Username,
    string? AvatarUrl,
    Guid IssuedById,
    string IssuedByUsername,
    string Reason,
    bool IsActive,
    DateTime CreatedAt
);

public record IssueWarningRequest(Guid UserId, string Reason);

// ── Bad Words ─────────────────────────────────────────────────────────────────

public record BadWordDto(Guid Id, string Word, string AddedByUsername, DateTime CreatedAt);

public record AddBadWordRequest(string Word);

// ── User Search ───────────────────────────────────────────────────────────────

public record UserSearchResultDto(
    Guid Id,
    string Username,
    string? AvatarUrl,
    int Role,
    bool IsBanned,
    int WarningCount
);
