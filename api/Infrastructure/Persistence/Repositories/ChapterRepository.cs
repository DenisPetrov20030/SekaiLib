using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class ChapterRepository : Repository<Chapter>, IChapterRepository
{
    public ChapterRepository(AppDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<Chapter>> GetAllAsync()
    {
        return await _dbSet
            .Include(c => c.Title) 
            .ToListAsync();
    }

    public async Task<IEnumerable<Chapter>> GetByTitleIdAsync(Guid titleId)
    {
        return await _dbSet
            .Include(c => c.Title) 
            .Where(c => c.TitleId == titleId)
            .OrderBy(c => c.Number)
            .ToListAsync();
    }

    public async Task<Chapter?> GetByTitleAndNumberAsync(Guid titleId, int number)
    {
        return await _dbSet
            .Include(c => c.Title) 
            .FirstOrDefaultAsync(c => c.TitleId == titleId && c.Number == number);
    }

    // Chapter comments
    public async Task<IEnumerable<ChapterComment>> GetCommentsByChapterIdAsync(Guid chapterId)
    {
        return await _context.ChapterComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .Where(c => c.ChapterId == chapterId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task AddCommentAsync(ChapterComment comment)
    {
        await _context.ChapterComments.AddAsync(comment);
    }

    public async Task<ChapterComment?> GetCommentByIdAsync(Guid commentId)
    {
        return await _context.ChapterComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .FirstOrDefaultAsync(c => c.Id == commentId);
    }

    public async Task<ChapterCommentReaction?> GetCommentReactionAsync(Guid userId, Guid commentId)
    {
        return await _context.ChapterCommentReactions
            .FirstOrDefaultAsync(r => r.UserId == userId && r.CommentId == commentId);
    }

    public async Task AddCommentReactionAsync(ChapterCommentReaction reaction)
    {
        await _context.ChapterCommentReactions.AddAsync(reaction);
    }

    public async Task RemoveCommentReactionAsync(ChapterCommentReaction reaction)
    {
        _context.ChapterCommentReactions.Remove(reaction);
        await Task.CompletedTask;
    }

    public async Task RemoveCommentAsync(ChapterComment comment)
    {
        _context.ChapterComments.Remove(comment);
        await Task.CompletedTask;
    }
}