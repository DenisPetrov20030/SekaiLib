using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Notifications;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Application.Services;

public class ChapterService : IChapterService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notifications;
    private readonly IUserBlockService _userBlockService;
    private readonly IViewTrackingService _viewTracking;
    private readonly IModerationService _moderation;

    public ChapterService(IUnitOfWork unitOfWork, INotificationService notifications,
        IUserBlockService userBlockService, IViewTrackingService viewTracking, IModerationService moderation)
    {
        _unitOfWork = unitOfWork;
        _notifications = notifications;
        _userBlockService = userBlockService;
        _viewTracking = viewTracking;
        _moderation = moderation;
    }

    public async Task<IEnumerable<ChapterDto>> GetChaptersByTitleAsync(Guid titleId, Guid? teamId = null)
    {
        var titleExists = await _unitOfWork.Titles.ExistsAsync(titleId);
        if (!titleExists)
            throw new NotFoundException("Title", titleId);

        var chapters = await _unitOfWork.Chapters.GetByTitleIdAsync(titleId);

        var query = chapters.AsEnumerable();
        if (teamId.HasValue)
            query = query.Where(c => c.TranslationTeamId == teamId.Value);

        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        return query
            .OrderBy(c => c.Number)
            .Select(c => new ChapterDto(c.Id, c.Number, c.Name, c.PublishedAt, c.IsPremium, c.Price, c.TranslationTeamId, c.TranslationTeam?.Name, c.TitleId, title.Name, title.CoverImageUrl, c.ViewCount));
    }

    public async Task<ChapterContentDto> GetChapterContentAsync(Guid chapterId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        return await BuildChapterContentDto(chapter);
    }

    public async Task<ChapterContentDto> GetChapterContentByNumberAsync(Guid titleId, int chapterNumber, Guid? userId = null)
    {
        var chapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(titleId, chapterNumber);
        if (chapter == null)
            throw new NotFoundException($"Chapter number {chapterNumber} for Title {titleId} was not found");

        return await BuildChapterContentDto(chapter, userId);
    }

    private async Task<ChapterContentDto> BuildChapterContentDto(Domain.Entities.Chapter chapter, Guid? userId = null)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(chapter.TitleId);
        if (title == null)
            throw new NotFoundException("Title", chapter.TitleId);

        var allChapters = (await _unitOfWork.Chapters.GetByTitleIdAsync(chapter.TitleId))
            .OrderBy(c => c.Number)
            .ToList();

        var currentIndex = allChapters.FindIndex(c => c.Number == chapter.Number);
        int? previousChapterNumber = currentIndex > 0 ? allChapters[currentIndex - 1].Number : null;
        int? nextChapterNumber = currentIndex < allChapters.Count - 1 ? allChapters[currentIndex + 1].Number : null;

        var earlyAccessExpired = chapter.EarlyAccessUntil.HasValue
            && DateTime.UtcNow > chapter.EarlyAccessUntil.Value;
        var isPremium = chapter.IsPremium && chapter.Price > 0 && !earlyAccessExpired;
        var isLocked = false;

        if (isPremium)
        {
            if (userId.HasValue)
            {
                var hasPurchase = await _unitOfWork.UserPurchases.Query()
                    .AnyAsync(p => p.UserId == userId.Value && p.ChapterId == chapter.Id);
                isLocked = !hasPurchase;
            }
            else
            {
                isLocked = true;
            }
        }

        return new ChapterContentDto(
            chapter.Id,
            chapter.Number,
            chapter.Name,
            isLocked ? string.Empty : chapter.Content,
            chapter.PublishedAt,
            title.Id,
            title.Name,
            previousChapterNumber,
            nextChapterNumber,
            chapter.ViewCount,
            isPremium,
            isLocked,
            chapter.Price,
            chapter.EarlyAccessUntil
        );
    }

    public async Task<ChapterContentDto> CreateAsync(Guid userId, Guid titleId, CreateChapterRequest request)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        var canCreate = title.PublisherId == userId || user.Role == UserRole.Administrator;

        if (!canCreate && request.TranslationTeamId.HasValue)
        {
            var teamMember = await _unitOfWork.TranslationTeamMembers.Query()
                .FirstOrDefaultAsync(m => m.TeamId == request.TranslationTeamId.Value && m.UserId == userId);

            if (teamMember != null)
                canCreate = true;
        }

        if (!canCreate)
        {
            var isAnyTeamMember = await _unitOfWork.TranslationTeamMembers.Query()
                .AnyAsync(m => m.UserId == userId);

            if (isAnyTeamMember)
                canCreate = true;
        }

        if (!canCreate)
            throw new ForbiddenException();

        var existingChapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(titleId, request.ChapterNumber);
        if (existingChapter != null)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request.ChapterNumber), new[] { $"Глава з номером {request.ChapterNumber} вже існує" } }
            });

        // Admin/publisher uploads are auto-approved; team member uploads go to moderation queue
        var isTeamUpload = request.TranslationTeamId.HasValue
            && title.PublisherId != userId
            && user.Role < UserRole.Administrator;

        var chapter = new Chapter
        {
            Id = Guid.NewGuid(),
            TitleId = titleId,
            Number = request.ChapterNumber,
            Name = request.Name,
            Content = PrepareTextForDb(request.Content),
            IsPremium = request.IsPremium,
            Price = request.Price,
            TranslationTeamId = request.TranslationTeamId,
            IsApproved = !isTeamUpload,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            EarlyAccessUntil = request.EarlyAccessUntil.HasValue
                ? DateTime.SpecifyKind(request.EarlyAccessUntil.Value, DateTimeKind.Utc)
                : null,
        };

        await _unitOfWork.Chapters.AddAsync(chapter);

        if (isTeamUpload)
            await _moderation.EnqueueAsync("Chapter", chapter.Id, null, userId, "chapter_upload");

        await _unitOfWork.SaveChangesAsync();

        // ---------------------------------------------------------
        // РОЗУМНИЙ ФІЛЬТР ДЛЯ ПІДПИСНИКІВ ТАЙТЛУ
        // Ураховуємо налаштування користувачів: стандартні статуси і власні списки
        // ---------------------------------------------------------
        var readingEntries = await _unitOfWork.ReadingLists.Query()
            .Where(rl => rl.TitleId == titleId)
            .Select(rl => new { rl.UserId, rl.Status, rl.UserListId })
            .ToListAsync();

        var followerGroups = readingEntries.GroupBy(e => e.UserId);

        var finalFollowers = new List<Guid>();

        foreach (var group in followerGroups)
        {
            var followerId = group.Key;
            if (followerId == userId) continue;

            // Загружаємо налаштування користувача
            var follower = await _unitOfWork.Users.GetByIdAsync(followerId);
            if (follower == null) continue;

            int[] notifyStatuses = Array.Empty<int>();
            string[] notifyUserListIds = Array.Empty<string>();
            try
            {
                if (!string.IsNullOrEmpty(follower.NotifyListStatuses))
                    notifyStatuses = System.Text.Json.JsonSerializer.Deserialize<int[]>(follower.NotifyListStatuses) ?? Array.Empty<int>();
            }
            catch { }
            try
            {
                if (!string.IsNullOrEmpty(follower.NotifyUserListIds))
                    notifyUserListIds = System.Text.Json.JsonSerializer.Deserialize<string[]>(follower.NotifyUserListIds) ?? Array.Empty<string>();
            }
            catch { }

            var shouldNotify = false;

            foreach (var entry in group)
            {
                // Custom list entry
                if (entry.UserListId.HasValue)
                {
                    var listIdStr = entry.UserListId.Value.ToString();
                    if (notifyUserListIds.Contains(listIdStr))
                    {
                        shouldNotify = true;
                        break;
                    }
                }
                else
                {
                    // Standard list entry (status)
                    if (notifyStatuses.Contains((int)entry.Status))
                    {
                        shouldNotify = true;
                        break;
                    }
                }
            }

            if (shouldNotify)
                finalFollowers.Add(followerId);
        }

        // Якщо глава прив'язана до команди — додатково фільтруємо тих, хто підписаний на конкретні команди (дзвінки)
        if (request.TranslationTeamId.HasValue)
        {
            var teamsOnThisTitle = await _unitOfWork.Chapters.Query()
                .Where(c => c.TitleId == titleId && c.TranslationTeamId != null)
                .Select(c => c.TranslationTeamId.Value)
                .Distinct()
                .ToListAsync();

            var followerSubscriptions = await _unitOfWork.TranslationTeamSubscriptions.Query()
                .Where(s => finalFollowers.Contains(s.UserId) && teamsOnThisTitle.Contains(s.TeamId))
                .ToListAsync();

            var filtered = new List<Guid>();
            foreach (var followerId in finalFollowers)
            {
                var userSubscribedTeams = followerSubscriptions
                    .Where(s => s.UserId == followerId)
                    .Select(s => s.TeamId)
                    .ToList();

                if (userSubscribedTeams.Any())
                {
                    if (userSubscribedTeams.Contains(request.TranslationTeamId.Value))
                        filtered.Add(followerId);
                }
                else
                {
                    // Якщо юзер не вибирав дзвіночків — залишаємо як є
                    filtered.Add(followerId);
                }
            }

            finalFollowers = filtered;
        }

        // Розсилаємо сповіщення відфільтрованому списку читачів
        foreach (var followerId in finalFollowers)
        {
            await _notifications.CreateAsync(new CreateNotificationRequest(
                followerId,
                NotificationType.NewChapter,
                "Нова глава",
                $"{title.Name} — Глава {chapter.Number}",
                $"/titles/{titleId}/chapters/{chapter.Number}",
                userId,
                titleId,
                chapter.Id
            ));
        }

        // ---------------------------------------------------------
        // СПОВІЩЕННЯ "КОМАНДА РОЗПОЧАЛА ПЕРЕВЕДЕННЯ" (Лише перша глава команди)
        // ---------------------------------------------------------
        if (request.TranslationTeamId.HasValue)
        {
            var teamChaptersCount = await _unitOfWork.Chapters.Query()
                .CountAsync(c => c.TitleId == titleId && c.TranslationTeamId == request.TranslationTeamId.Value);

            if (teamChaptersCount == 1)
            {
                var teamSubscriberIds = await _unitOfWork.TranslationTeamSubscriptions.Query()
                    .Where(s => s.TeamId == request.TranslationTeamId.Value)
                    .Select(s => s.UserId)
                    .Distinct()
                    .ToListAsync();

                var team = await _unitOfWork.TranslationTeams.GetByIdAsync(request.TranslationTeamId.Value);

                foreach (var subscriberId in teamSubscriberIds.Where(id => id != userId))
                {
                    await _notifications.CreateAsync(new CreateNotificationRequest(
                        subscriberId,
                        NotificationType.NewTeamChapter,
                        "КОМАНДА РОЗПОЧАЛА ПЕРЕВЕДЕННЯ",
                        $"{team?.Name ?? "Команда"} розпочала переведення: {title.Name}",
                        $"/titles/{titleId}",
                        userId,
                        titleId,
                        chapter.Id
                    ));
                }
            }
        }

        return await BuildChapterContentDto(chapter);
    }

    public async Task<ChapterContentDto> UpdateAsync(Guid userId, Guid chapterId, UpdateChapterRequest request)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        var title = await _unitOfWork.Titles.GetByIdAsync(chapter.TitleId);
        if (title == null)
            throw new NotFoundException("Title", chapter.TitleId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        var canManage = title.PublisherId == userId || user.Role == UserRole.Administrator;

        if (!canManage && chapter.TranslationTeamId.HasValue)
        {
            canManage = await _unitOfWork.TranslationTeamMembers.Query()
                .AnyAsync(m => m.TeamId == chapter.TranslationTeamId.Value && m.UserId == userId);
        }

        if (!canManage)
            throw new ForbiddenException();

        if (chapter.Number != request.ChapterNumber)
        {
            var existingChapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(chapter.TitleId, request.ChapterNumber);
            if (existingChapter != null && existingChapter.Id != chapterId)
                throw new ValidationException(new Dictionary<string, string[]> { { nameof(request.ChapterNumber), new[] { $"Глава з номером {request.ChapterNumber} вже існує" } } });
        }

        chapter.Number = request.ChapterNumber;
        chapter.Name = request.Name;
        chapter.Content = PrepareTextForDb(request.Content);
        chapter.IsPremium = request.IsPremium;
        chapter.Price = request.Price;

        await _unitOfWork.Chapters.UpdateAsync(chapter);
        await _unitOfWork.SaveChangesAsync();

        return await BuildChapterContentDto(chapter);
    }

    public async Task DeleteAsync(Guid userId, Guid chapterId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        var title = await _unitOfWork.Titles.GetByIdAsync(chapter.TitleId);
        if (title == null)
            throw new NotFoundException("Title", chapter.TitleId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        var canManage = title.PublisherId == userId || user.Role == UserRole.Administrator;

        if (!canManage && chapter.TranslationTeamId.HasValue)
        {
            canManage = await _unitOfWork.TranslationTeamMembers.Query()
                .AnyAsync(m => m.TeamId == chapter.TranslationTeamId.Value && m.UserId == userId);
        }

        if (!canManage)
        {
            canManage = await _unitOfWork.TranslationTeamMembers.Query()
                .AnyAsync(m => m.UserId == userId);
        }

        if (!canManage)
            throw new ForbiddenException();

        await _unitOfWork.Chapters.DeleteAsync(chapter);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<LatestChapterDto>> GetLatestChaptersAsync(int count)
    {
        var chapters = await _unitOfWork.Chapters.GetAllAsync();

        return chapters
            .Where(c => c.Title != null)
            .OrderByDescending(c => c.PublishedAt)
            .Take(count)
        .Select(c => new LatestChapterDto
        {
            Id = c.Id,
            Number = c.Number,
            CreatedAt = c.CreatedAt,
            Title = new TitleDto(
                c.Title.Id,
                c.Title.Name,
                c.Title.Author ?? "",
                c.Title.CoverImageUrl ?? "",
                c.Title.Description ?? "",
                c.Title.CountryOfOrigin ?? string.Empty,
                c.Title.Status,
                0
            )
        });
    }
    
    public async Task UpdateReadingProgressAsync(Guid userId, Guid titleId, int chapterNumber, int page)
    {
        var progress = await _unitOfWork.UserReadingProgresses
            .Query()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.TitleId == titleId);

        if (progress == null)
        {
            progress = new UserReadingProgress
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TitleId = titleId
            };
            await _unitOfWork.UserReadingProgresses.AddAsync(progress);
        }

        progress.ChapterNumber = chapterNumber;
        progress.CurrentPage = page;
        progress.LastReadAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();
    }
    
    private string PrepareTextForDb(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return input;

        return input
            .Replace("\r\n", "\n")           
            .Replace("\r", "\n")             
            .Replace(" - ", " — ")           
            .Replace("...", "…")             
            .Trim();                         
    }

    public async Task<IEnumerable<ChapterCommentResponse>> GetCommentsAsync(Guid chapterId, Guid? currentUserId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        var comments = await _unitOfWork.Chapters.GetCommentsByChapterIdAsync(chapterId);

        if (currentUserId.HasValue)
        {
            var blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(currentUserId.Value)).ToHashSet();
            comments = comments.Where(c => !blockedIds.Contains(c.UserId)).ToList();
        }

        var byId = comments.ToDictionary(c => c.Id);
        var roots = new List<ChapterComment>();
        foreach (var c in comments)
        {
            if (c.ParentCommentId.HasValue && byId.TryGetValue(c.ParentCommentId.Value, out var parent))
            {
                parent.Replies.Add(c);
            }
            else
            {
                roots.Add(c);
            }
        }

        ChapterCommentResponse Map(ChapterComment c)
        {
            var likes = c.Reactions.Count(r => r.Type == ReactionType.Like);
            var dislikes = c.Reactions.Count(r => r.Type == ReactionType.Dislike);
            var userReaction = currentUserId.HasValue
                ? c.Reactions.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Type
                : null;

            return new ChapterCommentResponse(
                c.Id,
                c.UserId,
                c.User.Username,
                c.User.AvatarUrl,
                c.Content,
                c.CreatedAt,
                likes,
                dislikes,
                userReaction,
                c.ParentCommentId,
                c.Replies.OrderBy(r => r.CreatedAt).Select(Map)
            );
        }

        return roots.OrderBy(r => r.CreatedAt).Select(Map);
    }

    public async Task<ChapterCommentResponse> AddCommentAsync(Guid userId, Guid chapterId, CreateChapterCommentRequest request)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        if (request.ParentCommentId.HasValue)
        {
            var parent = await _unitOfWork.Chapters.GetCommentByIdAsync(request.ParentCommentId.Value);
            if (parent == null)
                throw new NotFoundException("ChapterComment", request.ParentCommentId.Value);

            if (await _userBlockService.IsBlockedAsync(parent.UserId, userId))
                throw new ForbiddenException("Ви не можете відповідати на коментарі цього користувача.");
        }

        var comment = new ChapterComment
        {
            Id = Guid.NewGuid(),
            ChapterId = chapterId,
            UserId = userId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            ParentCommentId = request.ParentCommentId
        };

        await _unitOfWork.Chapters.AddCommentAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        if (comment.ParentCommentId.HasValue)
        {
            var parent = await _unitOfWork.Chapters.GetCommentByIdAsync(comment.ParentCommentId.Value);
            if (parent != null && parent.UserId != userId)
            {
                await _notifications.CreateAsync(new CreateNotificationRequest(
                    parent.UserId,
                    NotificationType.CommentReply,
                    "Відповідь на коментар",
                    $"{user.Username} відповів(ла) на ваш коментар до глави {chapter.Number}",
                    $"/titles/{chapter.TitleId}/chapters/{chapter.Number}#comment-{comment.Id}",
                    userId,
                    chapter.TitleId,
                    chapter.Id
                ));
            }
        }

        return new ChapterCommentResponse(
            comment.Id,
            userId,
            user.Username,
            user.AvatarUrl,
            comment.Content,
            comment.CreatedAt,
            0,
            0,
            null,
            comment.ParentCommentId,
            Enumerable.Empty<ChapterCommentResponse>()
        );
    }

    public async Task<ChapterCommentResponse> UpdateCommentAsync(Guid userId, Guid commentId, UpdateChapterCommentRequest request)
    {
        var comment = await _unitOfWork.Chapters.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("ChapterComment", commentId);

        if (comment.UserId != userId)
            throw new ForbiddenException();

        comment.Content = request.Content;
        await _unitOfWork.SaveChangesAsync();

        return await BuildCommentResponse(commentId, userId);
    }

    public async Task<ChapterCommentResponse> SetCommentReactionAsync(Guid userId, Guid commentId, ReactionType type)
    {
        var existing = await _unitOfWork.Chapters.GetCommentReactionAsync(userId, commentId);
        if (existing != null)
        {
            if (existing.Type == type)
            {
                return await BuildCommentResponse(commentId, userId);
            }

            existing.Type = type;
            await _unitOfWork.SaveChangesAsync();
            return await BuildCommentResponse(commentId, userId);
        }

        var reaction = new ChapterCommentReaction
        {
            Id = Guid.NewGuid(),
            CommentId = commentId,
            UserId = userId,
            Type = type,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Chapters.AddCommentReactionAsync(reaction);
        await _unitOfWork.SaveChangesAsync();

        return await BuildCommentResponse(commentId, userId);
    }

    public async Task RemoveCommentReactionAsync(Guid userId, Guid commentId)
    {
        var reaction = await _unitOfWork.Chapters.GetCommentReactionAsync(userId, commentId);
        if (reaction == null)
            throw new NotFoundException("ChapterCommentReaction", commentId);

        await _unitOfWork.Chapters.RemoveCommentReactionAsync(reaction);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteCommentAsync(Guid userId, Guid commentId)
    {
        var comment = await _unitOfWork.Chapters.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("ChapterComment", commentId);

        if (comment.UserId != userId)
            throw new ForbiddenException();

        await _unitOfWork.Chapters.RemoveCommentAsync(comment);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<ChapterCommentResponse> BuildCommentResponse(Guid commentId, Guid currentUserId)
    {
        var all = await _unitOfWork.Chapters.GetCommentsByChapterIdAsync(
            await GetChapterIdByCommentId(commentId)
        );

        var blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(currentUserId)).ToHashSet();
        all = all.Where(c => !blockedIds.Contains(c.UserId)).ToList();

        var dict = all.ToDictionary(c => c.Id);
        foreach (var c in all)
        {
            if (c.ParentCommentId.HasValue && dict.TryGetValue(c.ParentCommentId.Value, out var parent))
                parent.Replies.Add(c);
        }

        ChapterCommentResponse Map(ChapterComment c)
        {
            var likes = c.Reactions.Count(r => r.Type == ReactionType.Like);
            var dislikes = c.Reactions.Count(r => r.Type == ReactionType.Dislike);
            var userReaction = c.Reactions.FirstOrDefault(r => r.UserId == currentUserId)?.Type;
            return new ChapterCommentResponse(
                c.Id,
                c.UserId,
                c.User.Username,
                c.User.AvatarUrl,
                c.Content,
                c.CreatedAt,
                likes,
                dislikes,
                userReaction,
                c.ParentCommentId,
                c.Replies.OrderBy(r => r.CreatedAt).Select(Map)
            );
        }

        if (!dict.TryGetValue(commentId, out var target))
            throw new NotFoundException("ChapterComment", commentId);

        return Map(target);
    }

    public async Task<int> RecordViewAsync(Guid chapterId, Guid? userId, string ipAddress)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        // Redis fast-path: skip DB entirely if already seen within 24h
        var isNew = await _viewTracking.TryRecordViewAsync("chapter", chapterId, userId, ipAddress);
        if (!isNew)
            return chapter.ViewCount;

        // DB insert for analytics history
        var ipHash = HashIp(ipAddress);
        await _unitOfWork.ChapterViews.AddAsync(new ChapterView
        {
            Id = Guid.NewGuid(),
            ChapterId = chapterId,
            UserId = userId,
            IpHash = ipHash,
            ViewedAt = DateTime.UtcNow
        });

        chapter.ViewCount++;
        await _unitOfWork.Chapters.UpdateAsync(chapter);
        await _unitOfWork.SaveChangesAsync();

        return chapter.ViewCount;
    }

    private static string HashIp(string ip)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(bytes)[..16];     }

    private async Task<Guid> GetChapterIdByCommentId(Guid commentId)
    {
        var comment = await _unitOfWork.Chapters.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("ChapterComment", commentId);
        return comment.ChapterId;
    }
}