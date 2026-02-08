using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class ChapterRepository : Repository<Chapter>, IChapterRepository
{
    public ChapterRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<Chapter>> GetAllAsync()
    {
        return await _dbSet
            .Include(c => c.Title) 
            .ToListAsync();
    }

    public async Task<IEnumerable<Chapter>> GetByTitleIdAsync(Guid titleId)
    {
        return await _dbSet
            .Include(c => c.Title) 
            .Where(c => c.TitleId == titleId)
            .OrderBy(c => c.Number)
            .ToListAsync();
    }

    public async Task<Chapter?> GetByTitleAndNumberAsync(Guid titleId, int number)
    {
        return await _dbSet
            .Include(c => c.Title) 
            .FirstOrDefaultAsync(c => c.TitleId == titleId && c.Number == number);
    }
}