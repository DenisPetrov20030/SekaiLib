using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;
using SekaiLib.Application.Common;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class TitleRepository : Repository<Title>, ITitleRepository
{
    public TitleRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PagedResult<Title>> GetCatalogAsync(CatalogFilter filter, int page, int pageSize)
    {
        var query = _dbSet
            .Include(t => t.Chapters)
            .Include(t => t.TitleGenres)
                .ThenInclude(tg => tg.Genre)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            query = query.Where(t => t.Name.Contains(filter.Search) || t.Author.Contains(filter.Search));
        }

        if (filter.GenreId.HasValue)
        {
            query = query.Where(t => t.TitleGenres.Any(tg => tg.GenreId == filter.GenreId.Value));
        }

        if (!string.IsNullOrWhiteSpace(filter.Country))
        {
            query = query.Where(t => t.CountryOfOrigin == filter.Country);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(t => t.Status == filter.Status.Value);
        }

        var totalCount = await query.CountAsync();

        var data = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Title>
        {
            Data = data,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<Title?> GetWithChaptersAsync(Guid id)
    {
        return await _dbSet
            .Include(t => t.Publisher)
            .Include(t => t.Chapters)
            .Include(t => t.TitleGenres)
                .ThenInclude(tg => tg.Genre)
            .Include(t => t.TitleTranslators)
                .ThenInclude(tt => tt.TranslationTeam)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<Title>> SearchByNameAsync(string query)
    {
        return await _dbSet
            .Include(t => t.Chapters)
            .Where(t => t.Name.Contains(query))
            .OrderBy(t => t.Name)
            .Take(20)
            .ToListAsync();
    }

    public async Task<PagedResult<Title>> GetByPublisherAsync(Guid publisherId, int page, int pageSize)
    {
        var query = _dbSet
            .Include(t => t.Chapters)
            .Include(t => t.TitleGenres)
                .ThenInclude(tg => tg.Genre)
            .Where(t => t.PublisherId == publisherId);

        var totalCount = await query.CountAsync();

        var data = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Title>
        {
            Data = data,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}
