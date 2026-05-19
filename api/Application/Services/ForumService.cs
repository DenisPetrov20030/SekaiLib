using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Forum;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class ForumService : IForumService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IViewTrackingService _viewTracking;
    private readonly IReadCacheService _readCache;
    private readonly IAutoModerationService _autoMod;
    private readonly IModerationService _moderation;
    private readonly IUserBlockService _userBlockService;

    public ForumService(IUnitOfWork unitOfWork, IViewTrackingService viewTracking, IReadCacheService readCache,
        IAutoModerationService autoMod, IModerationService moderation, IUserBlockService userBlockService)
    {
        _unitOfWork = unitOfWork;
        _viewTracking = viewTracking;
        _readCache = readCache;
        _autoMod = autoMod;
        _moderation = moderation;
        _userBlockService = userBlockService;
    }

    // ------------------------------------------------------------------ Categories

    public async Task<IEnumerable<ForumCategoryDto>> GetCategoriesAsync()
    {
        var cached = await _readCache.GetAsync<List<ForumCategoryDto>>("forum:categories");
        if (cached != null) return cached;

        var categories = await _unitOfWork.ForumCategories.Query()
            .Where(c => c.IsVisible)
            .Include(c => c.Threads).ThenInclude(t => t.LastPostUser)
            .OrderBy(c => c.SortOrder)
            .ToListAsync();

        var result = categories.Select(MapCategory).ToList();
        await _readCache.SetAsync("forum:categories", result, TimeSpan.FromMinutes(5));
        return result;
    }

    public async Task<ForumCategoryDto> CreateCategoryAsync(Guid adminId, CreateCategoryRequest request)
    {
        await RequireModeratorAsync(adminId);

        var category = new ForumCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IconEmoji = request.IconEmoji,
            SortOrder = request.SortOrder,
            IsVisible = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ForumCategories.AddAsync(category);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");

        return MapCategory(category);
    }

    public async Task<ForumCategoryDto> UpdateCategoryAsync(Guid adminId, Guid categoryId, UpdateCategoryRequest request)
    {
        await RequireModeratorAsync(adminId);

        var category = await _unitOfWork.ForumCategories.GetByIdAsync(categoryId)
            ?? throw new NotFoundException("ForumCategory", categoryId);

        category.Name = request.Name.Trim();
        category.Description = request.Description?.Trim();
        category.IconEmoji = request.IconEmoji;
        category.SortOrder = request.SortOrder;
        category.IsVisible = request.IsVisible;

        await _unitOfWork.ForumCategories.UpdateAsync(category);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");

        return MapCategory(category);
    }

    public async Task DeleteCategoryAsync(Guid adminId, Guid categoryId)
    {
        await RequireModeratorAsync(adminId);

        var category = await _unitOfWork.ForumCategories.GetByIdAsync(categoryId)
            ?? throw new NotFoundException("ForumCategory", categoryId);

        await _unitOfWork.ForumCategories.DeleteAsync(category);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");
    }

    // ------------------------------------------------------------------ Threads

    public async Task<PagedResult<ForumThreadDto>> GetThreadsAsync(Guid categoryId, Guid? viewerUserId, int page, int pageSize)
    {
        var query = _unitOfWork.ForumThreads.Query()
            .Include(t => t.Author)
            .Include(t => t.LastPostUser)
            .Include(t => t.Category)
            .Where(t => t.CategoryId == categoryId);

        if (viewerUserId.HasValue)
        {
            var blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(viewerUserId.Value)).ToHashSet();
            if (blockedIds.Count > 0)
                query = query.Where(t => !blockedIds.Contains(t.AuthorId));
        }

        var total = await query.CountAsync();

        var threads = await query
            .OrderByDescending(t => t.IsPinned)
            .ThenByDescending(t => t.LastPostAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ForumThreadDto>
        {
            Data = threads.Select(MapThread).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PagedResult<ForumThreadDto>> SearchThreadsAsync(string query, Guid? viewerUserId, int page, int pageSize)
    {
        var q = _unitOfWork.ForumThreads.Query()
            .Include(t => t.Author)
            .Include(t => t.LastPostUser)
            .Include(t => t.Category)
            .Where(t => t.Title.Contains(query));

        if (viewerUserId.HasValue)
        {
            var blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(viewerUserId.Value)).ToHashSet();
            if (blockedIds.Count > 0)
                q = q.Where(t => !blockedIds.Contains(t.AuthorId));
        }

        var total = await q.CountAsync();

        var threads = await q
            .OrderByDescending(t => t.LastPostAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ForumThreadDto>
        {
            Data = threads.Select(MapThread).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ForumThreadDetailsDto> GetThreadAsync(Guid threadId, Guid? userId, string? ipAddress = null)
    {
        var thread = await _unitOfWork.ForumThreads.Query()
            .Include(t => t.Author)
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        if (await _viewTracking.TryRecordViewAsync("thread", threadId, userId, ipAddress))
        {
            thread.ViewCount++;
            await _unitOfWork.ForumThreads.UpdateAsync(thread);
            await _unitOfWork.SaveChangesAsync();
        }

        return MapThreadDetails(thread);
    }

    public async Task<ForumThreadDetailsDto> CreateThreadAsync(Guid userId, CreateThreadRequest request)
    {
        var category = await _unitOfWork.ForumCategories.GetByIdAsync(request.CategoryId)
            ?? throw new NotFoundException("ForumCategory", request.CategoryId);

        if (!category.IsVisible)
            throw new ForbiddenException("Категорія недоступна.");

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ValidationException("Title", "Заголовок не може бути порожнім.");

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ValidationException("Content", "Повідомлення не може бути порожнім.");

        var now = DateTime.UtcNow;

        var autoModResult = await _autoMod.CheckAsync(request.Title + "\n" + request.Content);
        var isHidden = autoModResult.IsFlagged;

        var thread = new ForumThread
        {
            Id = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            AuthorId = userId,
            Title = request.Title.Trim(),
            IsPinned = false,
            IsLocked = false,
            IsHidden = isHidden,
            ViewCount = 0,
            ReplyCount = 0,
            CreatedAt = now,
            UpdatedAt = now,
            LastPostAt = now,
            LastPostUserId = userId
        };

        await _unitOfWork.ForumThreads.AddAsync(thread);

        // First post = opening post
        var firstPost = new ForumPost
        {
            Id = Guid.NewGuid(),
            ThreadId = thread.Id,
            AuthorId = userId,
            Content = request.Content.Trim(),
            IsHidden = isHidden,
            CreatedAt = now
        };

        await _unitOfWork.ForumPosts.AddAsync(firstPost);

        if (isHidden)
            await _moderation.EnqueueAsync("ForumThread", thread.Id, request.Title + "\n" + request.Content,
                userId, autoModResult.Reason ?? "automod");

        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");

        // Reload with includes
        return await GetThreadAsync(thread.Id, userId);
    }

    public async Task<ForumThreadDetailsDto> UpdateThreadAsync(Guid userId, Guid threadId, UpdateThreadRequest request)
    {
        var thread = await _unitOfWork.ForumThreads.GetByIdAsync(threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedException();

        if (thread.AuthorId != userId && user.Role < UserRole.Moderator)
            throw new ForbiddenException();

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new ValidationException("Title", "Заголовок не може бути порожнім.");

        thread.Title = request.Title.Trim();
        thread.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.ForumThreads.UpdateAsync(thread);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");

        var updated = await _unitOfWork.ForumThreads.Query()
            .Include(t => t.Author)
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        return MapThreadDetails(updated);
    }

    public async Task DeleteThreadAsync(Guid userId, Guid threadId)
    {
        var thread = await _unitOfWork.ForumThreads.GetByIdAsync(threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedException();

        if (thread.AuthorId != userId && user.Role < UserRole.Moderator)
            throw new ForbiddenException();

        await _unitOfWork.ForumThreads.DeleteAsync(thread);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");
    }

    public async Task PinThreadAsync(Guid adminId, Guid threadId, bool pinned)
    {
        await RequireModeratorAsync(adminId);

        var thread = await _unitOfWork.ForumThreads.GetByIdAsync(threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        thread.IsPinned = pinned;
        await _unitOfWork.ForumThreads.UpdateAsync(thread);
        await _moderation.LogAsync(adminId, pinned ? ModerationAction.PinThread : ModerationAction.PinThread,
            "ForumThread", threadId, pinned ? "Pinned" : "Unpinned");
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task LockThreadAsync(Guid adminId, Guid threadId, bool locked)
    {
        await RequireModeratorAsync(adminId);

        var thread = await _unitOfWork.ForumThreads.GetByIdAsync(threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        thread.IsLocked = locked;
        await _unitOfWork.ForumThreads.UpdateAsync(thread);
        await _moderation.LogAsync(adminId, locked ? ModerationAction.LockThread : ModerationAction.LockThread,
            "ForumThread", threadId, locked ? "Locked" : "Unlocked");
        await _unitOfWork.SaveChangesAsync();
    }

    // ------------------------------------------------------------------ Posts

    public async Task<PagedResult<ForumPostDto>> GetPostsAsync(Guid threadId, Guid? userId, int page, int pageSize)
    {
        var threadExists = await _unitOfWork.ForumThreads.Query().AnyAsync(t => t.Id == threadId);
        if (!threadExists) throw new NotFoundException("ForumThread", threadId);

        var query = _unitOfWork.ForumPosts.Query()
            .Include(p => p.Author)
            .Include(p => p.Reactions)
            .Include(p => p.QuotedPost).ThenInclude(q => q != null ? q.Author : null)
            .Where(p => p.ThreadId == threadId && !p.IsDeleted)
            .OrderBy(p => p.CreatedAt);

        var total = await query.CountAsync();

        var posts = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<ForumPostDto>
        {
            Data = posts.Select(p => MapPost(p, userId)).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ForumPostDto> CreatePostAsync(Guid userId, Guid threadId, CreatePostRequest request)
    {
        var thread = await _unitOfWork.ForumThreads.GetByIdAsync(threadId)
            ?? throw new NotFoundException("ForumThread", threadId);

        if (thread.IsLocked)
            throw new ForbiddenException("Тред заблоковано.");

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ValidationException("Content", "Повідомлення не може бути порожнім.");

        ForumPost? quotedPost = null;
        if (request.QuotedPostId.HasValue)
        {
            quotedPost = await _unitOfWork.ForumPosts.Query()
                .Include(p => p.Author)
                .FirstOrDefaultAsync(p => p.Id == request.QuotedPostId.Value && p.ThreadId == threadId);
        }

        var now = DateTime.UtcNow;

        var autoModResult = await _autoMod.CheckAsync(request.Content);
        var isHidden = autoModResult.IsFlagged;

        var post = new ForumPost
        {
            Id = Guid.NewGuid(),
            ThreadId = threadId,
            AuthorId = userId,
            Content = request.Content.Trim(),
            IsHidden = isHidden,
            QuotedPostId = quotedPost?.Id,
            CreatedAt = now
        };

        await _unitOfWork.ForumPosts.AddAsync(post);

        // Update thread stats
        thread.ReplyCount++;
        thread.LastPostAt = now;
        thread.LastPostUserId = userId;
        thread.UpdatedAt = now;
        await _unitOfWork.ForumThreads.UpdateAsync(thread);

        if (isHidden)
            await _moderation.EnqueueAsync("ForumPost", post.Id, request.Content, userId,
                autoModResult.Reason ?? "automod");

        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");

        // Reload with author
        var saved = await _unitOfWork.ForumPosts.Query()
            .Include(p => p.Author)
            .Include(p => p.Reactions)
            .Include(p => p.QuotedPost).ThenInclude(q => q != null ? q.Author : null)
            .FirstAsync(p => p.Id == post.Id);

        return MapPost(saved, userId);
    }

    public async Task<ForumPostDto> UpdatePostAsync(Guid userId, Guid postId, UpdatePostRequest request)
    {
        var post = await _unitOfWork.ForumPosts.Query()
            .Include(p => p.Author)
            .Include(p => p.Reactions)
            .Include(p => p.QuotedPost).ThenInclude(q => q != null ? q.Author : null)
            .FirstOrDefaultAsync(p => p.Id == postId)
            ?? throw new NotFoundException("ForumPost", postId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedException();

        if (post.AuthorId != userId && user.Role < UserRole.Moderator)
            throw new ForbiddenException();

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ValidationException("Content", "Повідомлення не може бути порожнім.");

        post.Content = request.Content.Trim();
        post.IsEdited = true;
        post.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.ForumPosts.UpdateAsync(post);
        await _unitOfWork.SaveChangesAsync();

        return MapPost(post, userId);
    }

    public async Task DeletePostAsync(Guid userId, Guid postId)
    {
        var post = await _unitOfWork.ForumPosts.GetByIdAsync(postId)
            ?? throw new NotFoundException("ForumPost", postId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedException();

        if (post.AuthorId != userId && user.Role < UserRole.Moderator)
            throw new ForbiddenException();

        // Soft-delete to preserve thread structure
        post.IsDeleted = true;
        post.Content = "[Повідомлення видалено]";
        await _unitOfWork.ForumPosts.UpdateAsync(post);

        // Decrement thread counter (don't go below 0)
        var thread = await _unitOfWork.ForumThreads.GetByIdAsync(post.ThreadId);
        if (thread != null && thread.ReplyCount > 0)
        {
            thread.ReplyCount--;
            await _unitOfWork.ForumThreads.UpdateAsync(thread);
        }

        await _moderation.LogAsync(userId, ModerationAction.DeleteContent, "ForumPost", postId);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("forum:categories");
    }

    public async Task<ForumPostDto> ReactAsync(Guid userId, Guid postId, bool isLike)
    {
        var existing = await _unitOfWork.ForumPostReactions.Query()
            .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == userId);

        if (existing != null)
        {
            existing.IsLike = isLike;
            await _unitOfWork.ForumPostReactions.UpdateAsync(existing);
        }
        else
        {
            await _unitOfWork.ForumPostReactions.AddAsync(new ForumPostReaction
            {
                PostId = postId,
                UserId = userId,
                IsLike = isLike,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync();
        return await LoadPostDto(postId, userId);
    }

    public async Task<ForumPostDto> RemoveReactionAsync(Guid userId, Guid postId)
    {
        var reaction = await _unitOfWork.ForumPostReactions.Query()
            .FirstOrDefaultAsync(r => r.PostId == postId && r.UserId == userId);

        if (reaction != null)
        {
            await _unitOfWork.ForumPostReactions.DeleteAsync(reaction);
            await _unitOfWork.SaveChangesAsync();
        }

        return await LoadPostDto(postId, userId);
    }

    // ------------------------------------------------------------------ Helpers

    private async Task RequireModeratorAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new UnauthorizedException();
        if (user.Role < UserRole.Moderator)
            throw new ForbiddenException();
    }

    private async Task<ForumPostDto> LoadPostDto(Guid postId, Guid? userId)
    {
        var post = await _unitOfWork.ForumPosts.Query()
            .Include(p => p.Author)
            .Include(p => p.Reactions)
            .Include(p => p.QuotedPost).ThenInclude(q => q != null ? q.Author : null)
            .FirstOrDefaultAsync(p => p.Id == postId)
            ?? throw new NotFoundException("ForumPost", postId);

        return MapPost(post, userId);
    }

    private static ForumCategoryDto MapCategory(ForumCategory c)
    {
        var threads = c.Threads ?? new List<ForumThread>();
        var lastThread = threads.OrderByDescending(t => t.LastPostAt).FirstOrDefault();

        return new ForumCategoryDto(
            c.Id,
            c.Name,
            c.Description,
            c.IconEmoji,
            c.SortOrder,
            threads.Count,
            threads.Sum(t => t.ReplyCount + 1), // +1 for opening post
            lastThread?.LastPostAt,
            lastThread?.LastPostUser?.Username,
            lastThread?.Title
        );
    }

    private static ForumThreadDto MapThread(ForumThread t) => new(
        t.Id,
        t.CategoryId,
        t.Category?.Name ?? string.Empty,
        t.Title,
        t.AuthorId,
        t.Author?.Username ?? string.Empty,
        t.Author?.AvatarUrl,
        t.IsPinned,
        t.IsLocked,
        t.ViewCount,
        t.ReplyCount,
        t.CreatedAt,
        t.LastPostAt,
        t.LastPostUser?.Username
    );

    private static ForumThreadDetailsDto MapThreadDetails(ForumThread t) => new(
        t.Id,
        t.CategoryId,
        t.Category?.Name ?? string.Empty,
        t.Title,
        t.AuthorId,
        t.Author?.Username ?? string.Empty,
        t.Author?.AvatarUrl,
        t.IsPinned,
        t.IsLocked,
        t.ViewCount,
        t.ReplyCount,
        t.CreatedAt
    );

    private static ForumPostDto MapPost(ForumPost p, Guid? currentUserId)
    {
        var likes = p.Reactions.Count(r => r.IsLike);
        var dislikes = p.Reactions.Count(r => !r.IsLike);
        var userReaction = currentUserId.HasValue
            ? p.Reactions.FirstOrDefault(r => r.UserId == currentUserId.Value)?.IsLike
            : null;

        return new ForumPostDto(
            p.Id,
            p.ThreadId,
            p.AuthorId,
            p.Author?.Username ?? string.Empty,
            p.Author?.AvatarUrl,
            p.Content,
            p.QuotedPostId,
            p.QuotedPost?.IsDeleted == false ? p.QuotedPost.Content : null,
            p.QuotedPost?.Author?.Username,
            p.IsEdited,
            likes,
            dislikes,
            userReaction,
            p.CreatedAt,
            p.UpdatedAt,
            currentUserId.HasValue && p.AuthorId == currentUserId.Value,
            false // CanDelete — set by controller based on role
        );
    }

}
