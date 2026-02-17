using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface IUserListRepository : IRepository<UserList>
{
 Task<IEnumerable<UserList>> GetUserListsWithTitlesAsync(Guid userId);
 Task<UserList?> GetUserListWithTitlesByIdAsync(Guid listId);
}