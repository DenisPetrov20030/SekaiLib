using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface ITitleRatingRepository : IRepository<TitleRating>
{
    Task<TitleRating?> GetByUserAndTitleAsync(Guid userId, Guid titleId);
    Task<int> GetLikesCountAsync(Guid titleId);
    Task<int> GetDislikesCountAsync(Guid titleId);
}
