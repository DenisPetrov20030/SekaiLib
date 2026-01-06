using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class ReadingListRepository : Repository<ReadingList>, IReadingListRepository
{
    public ReadingListRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ReadingList>> GetByUserIdAsync(Guid userId)
    {
        return await DbSet
            .Include(rl => rl.Title)
            .Where(rl => rl.UserId == userId)
            .OrderByDescending(rl => rl.UpdatedAt)
            .ToListAsync();
    }

    public async Task<ReadingList?> GetByUserAndTitleAsync(Guid userId, Guid titleId)
    {
        return await DbSet
            .Include(rl => rl.Title)
            .FirstOrDefaultAsync(rl => rl.UserId == userId && rl.TitleId == titleId);
    }
}
