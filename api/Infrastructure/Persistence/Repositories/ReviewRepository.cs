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
            .Include(r => r.Comments)
                .ThenInclude(c => c.User)
            .Include(r => r.Comments)
                .ThenInclude(c => c.Reactions)
            .Where(r => r.TitleId == titleId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Review?> GetByUserAndTitleAsync(Guid userId, Guid titleId)
    {
        return await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Reactions)
            .AsNoTracking()
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

    public async Task<IEnumerable<ReviewComment>> GetCommentsByReviewIdAsync(Guid reviewId)
    {
        return await _context.ReviewComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .Where(c => c.ReviewId == reviewId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task AddCommentAsync(ReviewComment comment)
    {
        await _context.ReviewComments.AddAsync(comment);
    }

    public async Task<ReviewComment?> GetCommentByIdAsync(Guid commentId)
    {
        return await _context.ReviewComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .FirstOrDefaultAsync(c => c.Id == commentId);
    }

    public async Task RemoveCommentAsync(ReviewComment comment)
    {
        _context.ReviewComments.Remove(comment);
        await Task.CompletedTask;
    }

    public async Task<ReviewCommentReaction?> GetCommentReactionAsync(Guid userId, Guid commentId)
    {
        return await _context.ReviewCommentReactions
            .FirstOrDefaultAsync(r => r.UserId == userId && r.CommentId == commentId);
    }

    public async Task AddCommentReactionAsync(ReviewCommentReaction reaction)
    {
        await _context.ReviewCommentReactions.AddAsync(reaction);
    }

    public async Task RemoveCommentReactionAsync(ReviewCommentReaction reaction)
    {
        _context.ReviewCommentReactions.Remove(reaction);
        await Task.CompletedTask;
    }
}
