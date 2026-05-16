using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Moderation;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Interfaces;

public interface IModerationService
{
    // ── Queue ────────────────────────────────────────────────────────────
    Task<PagedResult<ModerationQueueItemDto>> GetQueueAsync(int page, int pageSize, ModerationStatus? status = null);
    Task<ModerationQueueItemDto> GetQueueItemAsync(Guid id);
    Task ApproveAsync(Guid moderatorId, Guid queueItemId);
    Task RejectAsync(Guid moderatorId, Guid queueItemId, string? reason);

    // ── Logs ─────────────────────────────────────────────────────────────
    Task<PagedResult<ModerationLogDto>> GetLogsAsync(int page, int pageSize);
    Task LogAsync(Guid moderatorId, ModerationAction action, string? targetType = null, Guid? targetId = null, string? details = null);

    // ── Stats ─────────────────────────────────────────────────────────────
    Task<ModerationStatsDto> GetStatsAsync();

    // ── Warnings ──────────────────────────────────────────────────────────
    Task<UserWarningDto> IssueWarningAsync(Guid moderatorId, Guid userId, string reason);
    Task RevokeWarningAsync(Guid moderatorId, Guid warningId);
    Task<IEnumerable<UserWarningDto>> GetUserWarningsAsync(Guid userId);

    // ── Bad Words ─────────────────────────────────────────────────────────
    Task<IEnumerable<BadWordDto>> GetBadWordsAsync();
    Task<BadWordDto> AddBadWordAsync(Guid moderatorId, string word);
    Task RemoveBadWordAsync(Guid moderatorId, Guid wordId);

    // ── User Search ───────────────────────────────────────────────────────
    Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(string query);

    // ── Queue item creation (called by content services) ──────────────────
    Task EnqueueAsync(string contentType, Guid contentId, string? snapshot, Guid authorId, string flagReason);
}
