using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.News;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class NewsService : INewsService
{
    private readonly IUnitOfWork _unitOfWork;

    public NewsService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<NewsDto>> GetPublishedAsync(int page, int pageSize)
    {
        var query = _unitOfWork.News.Query()
            .Include(n => n.Author)
            .Where(n => n.IsPublished)
            .OrderByDescending(n => n.CreatedAt);

        return await ToPagedResult(query, page, pageSize);
    }

    public async Task<PagedResult<NewsDto>> GetAllAsync(int page, int pageSize)
    {
        var query = _unitOfWork.News.Query()
            .Include(n => n.Author)
            .OrderByDescending(n => n.CreatedAt);

        return await ToPagedResult(query, page, pageSize);
    }

    public async Task<NewsDto?> GetByIdAsync(Guid id)
    {
        var news = await _unitOfWork.News.Query()
            .Include(n => n.Author)
            .FirstOrDefaultAsync(n => n.Id == id);

        return news == null ? null : MapToDto(news);
    }

    public async Task<NewsDto> CreateAsync(Guid authorId, CreateNewsRequest request)
    {
        var news = new Domain.Entities.News
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Content = request.Content,
            AuthorId = authorId,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.News.AddAsync(news);
        await _unitOfWork.SaveChangesAsync();

        var author = await _unitOfWork.Users.GetByIdAsync(authorId);
        news.Author = author!;

        return MapToDto(news);
    }

    public async Task<NewsDto> UpdateAsync(Guid authorId, Guid id, UpdateNewsRequest request)
    {
        var news = await _unitOfWork.News.Query()
            .Include(n => n.Author)
            .FirstOrDefaultAsync(n => n.Id == id)
            ?? throw new NotFoundException("News", id);

        news.Title = request.Title;
        news.Content = request.Content;
        news.IsPublished = request.IsPublished;
        news.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.News.UpdateAsync(news);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(news);
    }

    public async Task DeleteAsync(Guid id)
    {
        var news = await _unitOfWork.News.GetByIdAsync(id)
            ?? throw new NotFoundException("News", id);

        await _unitOfWork.News.DeleteAsync(news);
        await _unitOfWork.SaveChangesAsync();
    }

    private static async Task<PagedResult<NewsDto>> ToPagedResult(
        IQueryable<Domain.Entities.News> query, int page, int pageSize)
    {
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<NewsDto>
        {
            Data = items.Select(MapToDto),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    private static NewsDto MapToDto(Domain.Entities.News n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Content = n.Content,
        AuthorId = n.AuthorId,
        AuthorUsername = n.Author.Username,
        AuthorAvatarUrl = n.Author.AvatarUrl,
        IsPublished = n.IsPublished,
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt
    };
}
