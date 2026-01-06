using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Domain.Interfaces.Repositories;

public static class TitleGenreRepositoryExtensions
{
    public static async Task<IEnumerable<TitleGenre>> GetByTitleIdAsync(
        this IRepository<TitleGenre> repository,
        Guid titleId)
    {
        var allGenres = await repository.GetAllAsync();
        return allGenres.Where(tg => tg.TitleId == titleId).ToList();
    }
}
