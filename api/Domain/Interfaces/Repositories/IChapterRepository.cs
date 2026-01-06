using SekaiLib.Domain.Entities;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface IChapterRepository : IRepository<Chapter>
{
    Task<IEnumerable<Chapter>> GetByTitleIdAsync(Guid titleId);
    Task<Chapter?> GetByTitleAndNumberAsync(Guid titleId, int number);
}
