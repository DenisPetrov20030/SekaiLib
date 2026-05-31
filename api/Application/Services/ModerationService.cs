using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Moderation;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Infrastructure.Persistence;

namespace SekaiLib.Application.Services;

public class ModerationService : IModerationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _dbContext;
    private readonly IAutoModerationService _autoMod;

    public ModerationService(IUnitOfWork unitOfWork, AppDbContext dbContext, IAutoModerationService autoMod)
    {
        _unitOfWork = unitOfWork;
        _dbContext = dbContext;
        _autoMod = autoMod;
    }

    // ── Queue ──────────────────────────────────────────────────────────────────

    public async Task<PagedResult<ModerationQueueItemDto>> GetQueueAsync(int page, int pageSize, ModerationStatus? status = null)
    {
        var query = _unitOfWork.ModerationQueueItems.Query()
            .Include(q => q.Author)
            .Include(q => q.ReviewedBy)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(q => q.Status == status.Value);

        query = query.OrderByDescending(q => q.CreatedAt);

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ModerationQueueItemDto>
        {
            Data = items.Select(MapQueueItem).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ModerationQueueItemDto> GetQueueItemAsync(Guid id)
    {
        var item = await _unitOfWork.ModerationQueueItems.Query()
            .Include(q => q.Author)
            .Include(q => q.ReviewedBy)
            .FirstOrDefaultAsync(q => q.Id == id)
            ?? throw new NotFoundException("ModerationQueueItem", id);

        return MapQueueItem(item);
    }

    public async Task ApproveAsync(Guid moderatorId, Guid queueItemId)
    {
        var item = await _unitOfWork.ModerationQueueItems.Query()
            .Include(q => q.Author)
            .FirstOrDefaultAsync(q => q.Id == queueItemId)
            ?? throw new NotFoundException("ModerationQueueItem", queueItemId);

        if (item.Status != ModerationStatus.Pending)
            throw new ValidationException("Status", "Елемент вже оброблено.");

        // Unhide / approve the actual content
        await ApplyApprovalAsync(item.ContentType, item.ContentId);

        item.Status = ModerationStatus.Approved;
        item.ReviewedById = moderatorId;
        item.ReviewedAt = DateTime.UtcNow;
        await _unitOfWork.ModerationQueueItems.UpdateAsync(item);

        await LogAsync(moderatorId, ModerationAction.ApproveContent, item.ContentType, item.ContentId,
            $"Approved {item.ContentType} {item.ContentId}");

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RejectAsync(Guid moderatorId, Guid queueItemId, string? reason)
    {
        var item = await _unitOfWork.ModerationQueueItems.Query()
            .Include(q => q.Author)
            .FirstOrDefaultAsync(q => q.Id == queueItemId)
            ?? throw new NotFoundException("ModerationQueueItem", queueItemId);

        if (item.Status != ModerationStatus.Pending)
            throw new ValidationException("Status", "Елемент вже оброблено.");

        item.Status = ModerationStatus.Rejected;
        item.RejectionReason = reason;
        item.ReviewedById = moderatorId;
        item.ReviewedAt = DateTime.UtcNow;
        await _unitOfWork.ModerationQueueItems.UpdateAsync(item);

        await LogAsync(moderatorId, ModerationAction.RejectContent, item.ContentType, item.ContentId,
            reason ?? $"Rejected {item.ContentType} {item.ContentId}");

        await _unitOfWork.SaveChangesAsync();
    }

    // ── Logs ───────────────────────────────────────────────────────────────────

    public async Task<PagedResult<ModerationLogDto>> GetLogsAsync(int page, int pageSize)
    {
        var query = _unitOfWork.ModerationLogs.Query()
            .Include(l => l.Moderator)
            .OrderByDescending(l => l.CreatedAt);

        var total = await query.CountAsync();
        var logs = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<ModerationLogDto>
        {
            Data = logs.Select(MapLog).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task LogAsync(Guid moderatorId, ModerationAction action, string? targetType = null,
        Guid? targetId = null, string? details = null)
    {
        var log = new ModerationLog
        {
            Id = Guid.NewGuid(),
            ModeratorId = moderatorId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Details = details,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ModerationLogs.AddAsync(log);
        // Note: caller is responsible for SaveChangesAsync (or it batches with other changes)
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    public async Task<ModerationStatsDto> GetStatsAsync()
    {
        var pendingQueue = await _unitOfWork.ModerationQueueItems.Query()
            .CountAsync(q => q.Status == ModerationStatus.Pending);

        var pendingReports = await _unitOfWork.Reports.Query()
            .CountAsync(r => r.Status == ReportStatus.Pending);

        var activeBans = await _unitOfWork.UserBans.Query()
            .CountAsync(b => b.IsActive && (b.ExpiresAt == null || b.ExpiresAt > DateTime.UtcNow));

        var today = DateTime.UtcNow.Date;
        var warningsToday = await _unitOfWork.UserWarnings.Query()
            .CountAsync(w => w.CreatedAt >= today);

        return new ModerationStatsDto(pendingQueue, pendingReports, activeBans, warningsToday);
    }

    // ── Warnings ───────────────────────────────────────────────────────────────

    public async Task<UserWarningDto> IssueWarningAsync(Guid moderatorId, Guid userId, string reason)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var moderator = await _unitOfWork.Users.GetByIdAsync(moderatorId)
            ?? throw new UnauthorizedException();

        var warning = new UserWarning
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            IssuedById = moderatorId,
            Reason = reason,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.UserWarnings.AddAsync(warning);

        await LogAsync(moderatorId, ModerationAction.WarnUser, "User", userId, reason);

        await _unitOfWork.SaveChangesAsync();

        return new UserWarningDto(
            warning.Id,
            userId,
            user.Username,
            user.AvatarUrl,
            moderatorId,
            moderator.Username,
            reason,
            true,
            warning.CreatedAt
        );
    }

    public async Task RevokeWarningAsync(Guid moderatorId, Guid warningId)
    {
        var warning = await _unitOfWork.UserWarnings.Query()
            .Include(w => w.User)
            .FirstOrDefaultAsync(w => w.Id == warningId)
            ?? throw new NotFoundException("UserWarning", warningId);

        warning.IsActive = false;
        await _unitOfWork.UserWarnings.UpdateAsync(warning);

        await LogAsync(moderatorId, ModerationAction.RevokeWarning, "User", warning.UserId,
            $"Revoked warning {warningId}");

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserWarningDto>> GetUserWarningsAsync(Guid userId)
    {
        var warnings = await _unitOfWork.UserWarnings.Query()
            .Include(w => w.User)
            .Include(w => w.IssuedBy)
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return warnings.Select(w => new UserWarningDto(
            w.Id,
            w.UserId,
            w.User.Username,
            w.User.AvatarUrl,
            w.IssuedById,
            w.IssuedBy.Username,
            w.Reason,
            w.IsActive,
            w.CreatedAt
        ));
    }

    // ── Bad Words ──────────────────────────────────────────────────────────────

    public async Task<IEnumerable<BadWordDto>> GetBadWordsAsync()
    {
        var words = await _unitOfWork.BadWords.Query()
            .Include(w => w.AddedBy)
            .OrderBy(w => w.Word)
            .ToListAsync();

        return words.Select(w => new BadWordDto(w.Id, w.Word, w.AddedBy.Username, w.CreatedAt));
    }

    public async Task<BadWordDto> AddBadWordAsync(Guid moderatorId, string word)
    {
        var normalized = word.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
            throw new ValidationException("Word", "Слово не може бути порожнім.");

        var exists = await _unitOfWork.BadWords.Query()
            .AnyAsync(w => w.Word == normalized);
        if (exists)
            throw new ValidationException("Word", "Це слово вже є у списку.");

        var moderator = await _unitOfWork.Users.GetByIdAsync(moderatorId)
            ?? throw new UnauthorizedException();

        var badWord = new BadWord
        {
            Id = Guid.NewGuid(),
            Word = normalized,
            AddedById = moderatorId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.BadWords.AddAsync(badWord);
        await _unitOfWork.SaveChangesAsync();

        // Invalidate cache so next CheckAsync picks up the new word
        await _autoMod.InvalidateCacheAsync();

        return new BadWordDto(badWord.Id, badWord.Word, moderator.Username, badWord.CreatedAt);
    }

    public async Task RemoveBadWordAsync(Guid moderatorId, Guid wordId)
    {
        var word = await _unitOfWork.BadWords.GetByIdAsync(wordId)
            ?? throw new NotFoundException("BadWord", wordId);

        await _unitOfWork.BadWords.DeleteAsync(word);
        await _unitOfWork.SaveChangesAsync();

        await _autoMod.InvalidateCacheAsync();
    }

    // ── User Search ────────────────────────────────────────────────────────────

    public async Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(string query)
    {
        var users = await _unitOfWork.Users.Query()
            .Where(u => u.Username.Contains(query))
            .Take(20)
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();

        var warningCounts = await _unitOfWork.UserWarnings.Query()
            .Where(w => userIds.Contains(w.UserId) && w.IsActive)
            .GroupBy(w => w.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x.Count);

        var now = DateTime.UtcNow;
        var bannedIds = await _unitOfWork.UserBans.Query()
            .Where(b => userIds.Contains(b.UserId) && (b.ExpiresAt == null || b.ExpiresAt > now))
            .Select(b => b.UserId)
            .ToListAsync();

        return users.Select(u => new UserSearchResultDto(
            u.Id,
            u.Username,
            u.AvatarUrl,
            (int)u.Role,
            bannedIds.Contains(u.Id),
            warningCounts.GetValueOrDefault(u.Id, 0)
        ));
    }

    // ── Enqueue ────────────────────────────────────────────────────────────────

    public async Task EnqueueAsync(string contentType, Guid contentId, string? snapshot,
        Guid authorId, string flagReason)
    {
        var queueItem = new ModerationQueueItem
        {
            Id = Guid.NewGuid(),
            ContentType = contentType,
            ContentId = contentId,
            ContentSnapshot = snapshot,
            AuthorId = authorId,
            FlagReason = flagReason,
            Status = ModerationStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ModerationQueueItems.AddAsync(queueItem);
        // Caller calls SaveChangesAsync
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private async Task ApplyApprovalAsync(string contentType, Guid contentId)
    {
        switch (contentType)
        {
            case "ForumPost":
                var post = await _dbContext.ForumPosts.FindAsync(contentId);
                if (post != null) { post.IsHidden = false; }
                break;

            case "ForumThread":
                var thread = await _dbContext.ForumThreads.FindAsync(contentId);
                if (thread != null) { thread.IsHidden = false; }
                break;

            case "Review":
                var review = await _dbContext.Reviews.FindAsync(contentId);
                if (review != null) { review.IsHidden = false; }
                break;

            case "Chapter":
                var chapter = await _dbContext.Chapters.FindAsync(contentId);
                if (chapter != null) { chapter.IsApproved = true; }
                break;

            case "ChapterComment":
                var chapterComment = await _dbContext.ChapterComments.FindAsync(contentId);
                if (chapterComment != null) { chapterComment.IsHidden = false; }
                break;

            case "TitleComment":
                var titleComment = await _dbContext.TitleComments.FindAsync(contentId);
                if (titleComment != null) { titleComment.IsHidden = false; }
                break;
        }
    }

    private static ModerationQueueItemDto MapQueueItem(ModerationQueueItem q) => new(
        q.Id,
        q.ContentType,
        q.ContentId,
        q.ContentSnapshot,
        q.AuthorId,
        q.Author?.Username ?? string.Empty,
        q.Author?.AvatarUrl,
        q.FlagReason,
        q.Status,
        q.RejectionReason,
        q.ReviewedById,
        q.ReviewedBy?.Username,
        q.ReviewedAt,
        q.CreatedAt
    );

    private static ModerationLogDto MapLog(ModerationLog l) => new(
        l.Id,
        l.ModeratorId,
        l.Moderator?.Username ?? string.Empty,
        l.Moderator?.AvatarUrl,
        l.Action,
        l.TargetType,
        l.TargetId,
        l.Details,
        l.CreatedAt
    );
}
