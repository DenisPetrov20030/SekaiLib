using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Collections;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class CollectionService : ICollectionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IViewTrackingService _viewTracking;

    public CollectionService(IUnitOfWork unitOfWork, IViewTrackingService viewTracking)
    {
        _unitOfWork = unitOfWork;
        _viewTracking = viewTracking;
    }

    public async Task<PagedResult<CollectionDto>> GetAllAsync(string? search, int page, int pageSize)
    {
        var query = _unitOfWork.Collections.Query()
            .Include(c => c.Author)
            .Include(c => c.Items).ThenInclude(i => i.Title)
            .Include(c => c.Comments)
            .Include(c => c.Reactions)
            .Where(c => c.IsPublic);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Title.Contains(search));

        var totalCount = await query.CountAsync();

        var collections = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<CollectionDto>
        {
            Data = collections.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<IEnumerable<CollectionDto>> GetByUserAsync(Guid userId)
    {
        var collections = await _unitOfWork.Collections.Query()
            .Include(c => c.Author)
            .Include(c => c.Items).ThenInclude(i => i.Title)
            .Include(c => c.Comments)
            .Include(c => c.Reactions)
            .Where(c => c.AuthorId == userId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return collections.Select(MapToDto);
    }

    public async Task<CollectionDetailsDto> GetByIdAsync(Guid id, Guid? viewerUserId, string? ipAddress = null)
    {
        var collection = await _unitOfWork.Collections.Query()
            .Include(c => c.Author)
            .Include(c => c.Sections.OrderBy(s => s.SortOrder))
                .ThenInclude(s => s.Items.OrderBy(i => i.SortOrder))
                    .ThenInclude(i => i.Title)
            .Include(c => c.Items.Where(i => i.SectionId == null).OrderBy(i => i.SortOrder))
                .ThenInclude(i => i.Title)
            .Include(c => c.Comments)
            .Include(c => c.Reactions)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundException("Collection", id);

        if (await _viewTracking.TryRecordViewAsync("collection", id, viewerUserId, ipAddress))
        {
            collection.ViewCount++;
            await _unitOfWork.SaveChangesAsync();
        }

        bool? userReaction = null;
        if (viewerUserId.HasValue)
        {
            var reaction = collection.Reactions.FirstOrDefault(r => r.UserId == viewerUserId.Value);
            if (reaction != null) userReaction = reaction.IsLike;
        }

        var sections = collection.Sections
            .OrderBy(s => s.SortOrder)
            .Select(s => new CollectionSectionDto(
                s.Id,
                s.Name,
                s.SortOrder,
                s.Items.OrderBy(i => i.SortOrder).Select(MapItemToDto)
            ));

        var uncategorized = collection.Items
            .Where(i => i.SectionId == null)
            .OrderBy(i => i.SortOrder)
            .Select(MapItemToDto);

        return new CollectionDetailsDto(
            collection.Id,
            collection.Title,
            collection.Description,
            collection.AuthorId,
            collection.Author.Username,
            collection.Author.AvatarUrl,
            collection.IsPublic,
            collection.ViewCount,
            collection.Comments.Count,
            collection.Reactions.Count(r => r.IsLike),
            collection.Reactions.Count(r => !r.IsLike),
            userReaction,
            sections,
            uncategorized,
            collection.CreatedAt
        );
    }

    public async Task<CollectionDetailsDto> CreateAsync(Guid authorId, CreateCollectionRequest request)
    {
        var collection = new Collection
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            AuthorId = authorId,
            IsPublic = request.IsPublic,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Collections.AddAsync(collection);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(collection.Id, authorId);
    }

    public async Task<CollectionDetailsDto> UpdateAsync(Guid userId, Guid id, UpdateCollectionRequest request)
    {
        var collection = await _unitOfWork.Collections.GetByIdAsync(id)
            ?? throw new NotFoundException("Collection", id);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        collection.Title = request.Title.Trim();
        collection.Description = request.Description?.Trim();
        collection.IsPublic = request.IsPublic;
        collection.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Collections.UpdateAsync(collection);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(id, userId);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var collection = await _unitOfWork.Collections.GetByIdAsync(id)
            ?? throw new NotFoundException("Collection", id);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        await _unitOfWork.Collections.DeleteAsync(collection);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<CollectionSectionDto> AddSectionAsync(Guid userId, Guid collectionId, AddSectionRequest request)
    {
        var collection = await _unitOfWork.Collections.Query()
            .Include(c => c.Sections)
            .FirstOrDefaultAsync(c => c.Id == collectionId)
            ?? throw new NotFoundException("Collection", collectionId);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        var nextOrder = collection.Sections.Any()
            ? collection.Sections.Max(s => s.SortOrder) + 1
            : 0;

        var section = new CollectionSection
        {
            Id = Guid.NewGuid(),
            CollectionId = collectionId,
            Name = request.Name.Trim(),
            SortOrder = nextOrder
        };

        await _unitOfWork.CollectionSections.AddAsync(section);
        await _unitOfWork.SaveChangesAsync();

        return new CollectionSectionDto(section.Id, section.Name, section.SortOrder, Enumerable.Empty<CollectionItemDto>());
    }

    public async Task UpdateSectionAsync(Guid userId, Guid collectionId, Guid sectionId, string name)
    {
        var collection = await _unitOfWork.Collections.GetByIdAsync(collectionId)
            ?? throw new NotFoundException("Collection", collectionId);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        var section = await _unitOfWork.CollectionSections.GetByIdAsync(sectionId)
            ?? throw new NotFoundException("CollectionSection", sectionId);

        section.Name = name.Trim();
        await _unitOfWork.CollectionSections.UpdateAsync(section);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteSectionAsync(Guid userId, Guid collectionId, Guid sectionId)
    {
        var collection = await _unitOfWork.Collections.GetByIdAsync(collectionId)
            ?? throw new NotFoundException("Collection", collectionId);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        var section = await _unitOfWork.CollectionSections.GetByIdAsync(sectionId)
            ?? throw new NotFoundException("CollectionSection", sectionId);

        // Move items to uncategorized before deleting section
        var sectionItems = await _unitOfWork.CollectionItems.Query()
            .Where(i => i.SectionId == sectionId)
            .ToListAsync();

        foreach (var item in sectionItems)
        {
            item.SectionId = null;
            await _unitOfWork.CollectionItems.UpdateAsync(item);
        }

        await _unitOfWork.CollectionSections.DeleteAsync(section);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<CollectionItemDto> AddItemAsync(Guid userId, Guid collectionId, AddCollectionItemRequest request)
    {
        var collection = await _unitOfWork.Collections.Query()
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == collectionId)
            ?? throw new NotFoundException("Collection", collectionId);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        // Prevent duplicates
        var alreadyExists = collection.Items.Any(i => i.TitleId == request.TitleId);
        if (alreadyExists)
            throw new ValidationException("TitleId", "Цей тайтл вже є в колекції.");

        var nextOrder = collection.Items.Any()
            ? collection.Items.Max(i => i.SortOrder) + 1
            : 0;

        var item = new CollectionItem
        {
            Id = Guid.NewGuid(),
            CollectionId = collectionId,
            SectionId = request.SectionId,
            TitleId = request.TitleId,
            SortOrder = nextOrder,
            AddedAt = DateTime.UtcNow
        };

        await _unitOfWork.CollectionItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        // Load title for response
        var title = await _unitOfWork.Titles.GetByIdAsync(request.TitleId);
        return new CollectionItemDto(item.Id, item.TitleId, title?.Name ?? "", title?.CoverImageUrl, item.SortOrder);
    }

    public async Task RemoveItemAsync(Guid userId, Guid collectionId, Guid itemId)
    {
        var collection = await _unitOfWork.Collections.GetByIdAsync(collectionId)
            ?? throw new NotFoundException("Collection", collectionId);

        if (collection.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цієї колекції.");

        var item = await _unitOfWork.CollectionItems.GetByIdAsync(itemId)
            ?? throw new NotFoundException("CollectionItem", itemId);

        await _unitOfWork.CollectionItems.DeleteAsync(item);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ReactAsync(Guid userId, Guid collectionId, bool isLike)
    {
        var exists = await _unitOfWork.Collections.Query()
            .AnyAsync(c => c.Id == collectionId);
        if (!exists) throw new NotFoundException("Collection", collectionId);

        var existing = await _unitOfWork.CollectionReactions.Query()
            .FirstOrDefaultAsync(r => r.CollectionId == collectionId && r.UserId == userId);

        if (existing != null)
        {
            existing.IsLike = isLike;
            await _unitOfWork.CollectionReactions.UpdateAsync(existing);
        }
        else
        {
            await _unitOfWork.CollectionReactions.AddAsync(new CollectionReaction
            {
                CollectionId = collectionId,
                UserId = userId,
                IsLike = isLike,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task RemoveReactionAsync(Guid userId, Guid collectionId)
    {
        var reaction = await _unitOfWork.CollectionReactions.Query()
            .FirstOrDefaultAsync(r => r.CollectionId == collectionId && r.UserId == userId);

        if (reaction == null) return;

        await _unitOfWork.CollectionReactions.DeleteAsync(reaction);
        await _unitOfWork.SaveChangesAsync();
    }

    private static CollectionDto MapToDto(Collection c) => new(
        c.Id,
        c.Title,
        c.Description,
        c.AuthorId,
        c.Author.Username,
        c.Author.AvatarUrl,
        c.IsPublic,
        c.ViewCount,
        c.Comments.Count,
        c.Items.Count,
        c.Reactions.Count(r => r.IsLike),
        c.Reactions.Count(r => !r.IsLike),
        c.Items.Take(4).Select(i => i.Title?.CoverImageUrl).Where(u => u != null).ToArray()!,
        c.CreatedAt
    );

    private static CollectionItemDto MapItemToDto(CollectionItem i) => new(
        i.Id, i.TitleId, i.Title?.Name ?? "", i.Title?.CoverImageUrl, i.SortOrder
    );

}

public class CollectionCommentService : ICollectionCommentService
{
    private readonly IUnitOfWork _unitOfWork;

    public CollectionCommentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<CollectionCommentDto>> GetByCollectionAsync(Guid collectionId)
    {
        var comments = await _unitOfWork.CollectionComments.Query()
            .Include(c => c.Author)
            .Include(c => c.Replies)
            .Where(c => c.CollectionId == collectionId && c.ParentCommentId == null)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(MapToDto);
    }

    public async Task<IEnumerable<CollectionCommentDto>> GetRepliesAsync(Guid commentId)
    {
        var replies = await _unitOfWork.CollectionComments.Query()
            .Include(c => c.Author)
            .Include(c => c.Replies)
            .Where(c => c.ParentCommentId == commentId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return replies.Select(MapToDto);
    }

    public async Task<CollectionCommentDto> CreateAsync(Guid authorId, Guid collectionId, CreateCollectionCommentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
            throw new ValidationException("Content", "Коментар не може бути порожнім.");

        var exists = await _unitOfWork.Collections.Query().AnyAsync(c => c.Id == collectionId);
        if (!exists) throw new NotFoundException("Collection", collectionId);

        var comment = new CollectionComment
        {
            Id = Guid.NewGuid(),
            CollectionId = collectionId,
            AuthorId = authorId,
            Content = request.Content.Trim(),
            ParentCommentId = request.ParentCommentId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.CollectionComments.AddAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        var author = await _unitOfWork.Users.GetByIdAsync(authorId);
        return new CollectionCommentDto(
            comment.Id, comment.AuthorId,
            author?.Username ?? "", author?.AvatarUrl,
            comment.Content, comment.ParentCommentId, 0, comment.CreatedAt
        );
    }

    public async Task DeleteAsync(Guid userId, Guid commentId, bool isAdmin)
    {
        var comment = await _unitOfWork.CollectionComments.GetByIdAsync(commentId)
            ?? throw new NotFoundException("CollectionComment", commentId);

        if (!isAdmin && comment.AuthorId != userId)
            throw new ForbiddenException("Ви не є автором цього коментаря.");

        await _unitOfWork.CollectionComments.DeleteAsync(comment);
        await _unitOfWork.SaveChangesAsync();
    }

    private static CollectionCommentDto MapToDto(CollectionComment c) => new(
        c.Id, c.AuthorId, c.Author.Username, c.Author.AvatarUrl,
        c.Content, c.ParentCommentId, c.Replies.Count, c.CreatedAt
    );
}
