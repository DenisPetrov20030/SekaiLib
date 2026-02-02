using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Interfaces.Repositories;
using SekaiLib.Infrastructure.Persistence.Repositories;

namespace SekaiLib.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IUserRepository Users { get; }
    public ITitleRepository Titles { get; }
    public IChapterRepository Chapters { get; }
    public IReadingListRepository ReadingLists { get; }
    public IReviewRepository Reviews { get; }
    public ITitleRatingRepository TitleRatings { get; }
    public IRepository<Genre> Genres { get; }
    public IRepository<TitleGenre> TitleGenres { get; }
    public IRepository<TranslationTeam> TranslationTeams { get; }
    public IRepository<RefreshToken> RefreshTokens { get; }
    public IUserListRepository UserLists { get; } 
    
    public UnitOfWork(
        AppDbContext context,
        IUserRepository users,
        ITitleRepository titles,
        IChapterRepository chapters,
        IReadingListRepository readingLists,
        IReviewRepository reviews,
        ITitleRatingRepository titleRatings,
        IRepository<Genre> genres,
        IRepository<TitleGenre> titleGenres,
        IRepository<TranslationTeam> translationTeams,
        IRepository<RefreshToken> refreshTokens,
        IUserListRepository userLists) 
    {
        _context = context;
        Users = users;
        Titles = titles;
        Chapters = chapters;
        ReadingLists = readingLists;
        Reviews = reviews;
        TitleRatings = titleRatings;
        Genres = genres;
        TitleGenres = titleGenres;
        TranslationTeams = translationTeams;
        RefreshTokens = refreshTokens;
        UserLists = userLists; 
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}