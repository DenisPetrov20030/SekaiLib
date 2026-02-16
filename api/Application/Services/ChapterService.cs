using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace SekaiLib.Application.Services;

public class ChapterService : IChapterService
{
    private readonly IUnitOfWork _unitOfWork;

    public ChapterService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ChapterDto>> GetChaptersByTitleAsync(Guid titleId)
    {
        var titleExists = await _unitOfWork.Titles.ExistsAsync(titleId);
        if (!titleExists)
            throw new NotFoundException("Title", titleId);

        var chapters = await _unitOfWork.Chapters.GetByTitleIdAsync(titleId);

        return chapters
            .OrderBy(c => c.Number)
            .Select(c => new ChapterDto(c.Id, c.Number, c.Name, c.PublishedAt, c.IsPremium));
    }

    public async Task<ChapterContentDto> GetChapterContentAsync(Guid chapterId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        return await BuildChapterContentDto(chapter);
    }

    public async Task<ChapterContentDto> GetChapterContentByNumberAsync(Guid titleId, int chapterNumber)
    {
        var chapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(titleId, chapterNumber);
        if (chapter == null)
            throw new NotFoundException($"Chapter number {chapterNumber} for Title {titleId} was not found");

        return await BuildChapterContentDto(chapter);
    }

    private async Task<ChapterContentDto> BuildChapterContentDto(Domain.Entities.Chapter chapter)
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

        return new ChapterContentDto(
            chapter.Id,
            chapter.Number,
            chapter.Name,
            chapter.Content,
            chapter.PublishedAt,
            title.Id,
            title.Name,
            previousChapterNumber,
            nextChapterNumber
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

        if (title.PublisherId != userId && user.Role != UserRole.Administrator)
            throw new ForbiddenException();

        var existingChapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(titleId, request.ChapterNumber);
        if (existingChapter != null)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request.ChapterNumber), new[] { $"Глава з номером {request.ChapterNumber} вже існує" } }
            });

        var chapter = new Chapter
        {
            Id = Guid.NewGuid(),
            TitleId = titleId,
            Number = request.ChapterNumber,
            Name = request.Name,
            Content = PrepareTextForDb(request.Content), 
            IsPremium = request.IsPremium,
            PublishedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow // Додано поле CreatedAt
        };

        await _unitOfWork.Chapters.AddAsync(chapter);
        await _unitOfWork.SaveChangesAsync();

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

        if (title.PublisherId != userId && user.Role != UserRole.Administrator)
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

        if (title.PublisherId != userId && user.Role != UserRole.Administrator)
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

    // Comments
    public async Task<IEnumerable<ChapterCommentResponse>> GetCommentsAsync(Guid chapterId, Guid? currentUserId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        var comments = await _unitOfWork.Chapters.GetCommentsByChapterIdAsync(chapterId);

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

    private async Task<Guid> GetChapterIdByCommentId(Guid commentId)
    {
        var comment = await _unitOfWork.Chapters.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("ChapterComment", commentId);
        return comment.ChapterId;
    }
}