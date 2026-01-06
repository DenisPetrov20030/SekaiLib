using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Review>> GetByTitleIdAsync(Guid titleId)
    {
        return await Context.Reviews
            .Include(r => r.User)
            .Include(r => r.Reactions)
            .Where(r => r.TitleId == titleId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Review?> GetByUserAndTitleAsync(Guid userId, Guid titleId)
    {
        return await Context.Reviews
            .Include(r => r.Reactions)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.TitleId == titleId);
    }

    public async Task<ReviewReaction?> GetReactionAsync(Guid userId, Guid reviewId)
    {
        return await Context.ReviewReactions
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ReviewId == reviewId);
    }

    public async Task AddReactionAsync(ReviewReaction reaction)
    {
        await Context.ReviewReactions.AddAsync(reaction);
    }

    public async Task RemoveReactionAsync(ReviewReaction reaction)
    {
        Context.ReviewReactions.Remove(reaction);
        await Task.CompletedTask;
    }
}
