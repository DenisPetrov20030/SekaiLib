using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class TitleRatingRepository : Repository<TitleRating>, ITitleRatingRepository
{
    public TitleRatingRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<TitleRating?> GetByUserAndTitleAsync(Guid userId, Guid titleId)
    {
        return await Context.TitleRatings
            .FirstOrDefaultAsync(r => r.UserId == userId && r.TitleId == titleId);
    }

    public async Task<int> GetLikesCountAsync(Guid titleId)
    {
        return await Context.TitleRatings
            .CountAsync(r => r.TitleId == titleId && r.Type == ReactionType.Like);
    }

    public async Task<int> GetDislikesCountAsync(Guid titleId)
    {
        return await Context.TitleRatings
            .CountAsync(r => r.TitleId == titleId && r.Type == ReactionType.Dislike);
    }
}
