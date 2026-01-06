using SekaiLib.Domain.Entities;
using SekaiLib.Application.Common;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface ITitleRepository : IRepository<Title>
{
    Task<PagedResult<Title>> GetCatalogAsync(CatalogFilter filter, int page, int pageSize);
    Task<Title?> GetWithChaptersAsync(Guid id);
    Task<IEnumerable<Title>> SearchByNameAsync(string query);
}
