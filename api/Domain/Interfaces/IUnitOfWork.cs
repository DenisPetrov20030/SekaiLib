using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Domain.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    ITitleRepository Titles { get; }
    IChapterRepository Chapters { get; }
    IReadingListRepository ReadingLists { get; }
    IReviewRepository Reviews { get; }
    ITitleRatingRepository TitleRatings { get; }
    IRepository<Genre> Genres { get; }
    IRepository<TranslationTeam> TranslationTeams { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    Task<int> SaveChangesAsync();
}
