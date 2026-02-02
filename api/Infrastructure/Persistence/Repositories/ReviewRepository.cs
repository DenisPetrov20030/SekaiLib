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
        return await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Reactions)
            .Where(r => r.TitleId == titleId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Review?> GetByUserAndTitleAsync(Guid userId, Guid titleId)
    {
        return await _context.Reviews
            .Include(r => r.Reactions)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.TitleId == titleId);
    }

    public async Task<ReviewReaction?> GetReactionAsync(Guid userId, Guid reviewId)
    {
        return await _context.ReviewReactions
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ReviewId == reviewId);
    }

    public async Task AddReactionAsync(ReviewReaction reaction)
    {
        await _context.ReviewReactions.AddAsync(reaction);
    }

    public async Task RemoveReactionAsync(ReviewReaction reaction)
    {
        _context.ReviewReactions.Remove(reaction);
        await Task.CompletedTask;
    }
}
