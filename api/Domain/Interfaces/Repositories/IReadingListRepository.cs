using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface IReadingListRepository : IRepository<ReadingList>
{
    Task<IEnumerable<ReadingList>> GetByUserIdAsync(Guid userId);
    Task<ReadingList?> GetByUserAndTitleAsync(Guid userId, Guid titleId);
}
