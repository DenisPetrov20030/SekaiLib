using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;
using SekaiLib.Infrastructure.Persistence;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class UserListRepository : Repository<UserList>, IUserListRepository
{
    public UserListRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<UserList>> GetUserListsWithTitlesAsync(Guid userId)
    {
        return await _context.UserLists
            .AsNoTracking() // Оптимізація для читання
            .Include(x => x.ReadingListItems) 
                .ThenInclude(rl => rl.Title) 
            .Where(x => x.UserId == userId)
            .ToListAsync();
    }

    public async Task<UserList?> GetUserListWithTitlesByIdAsync(Guid listId)
    {
        return await _context.UserLists
            .AsNoTracking()
            .Include(x => x.ReadingListItems)
                .ThenInclude(rl => rl.Title)
            .FirstOrDefaultAsync(x => x.Id == listId);
    }
}