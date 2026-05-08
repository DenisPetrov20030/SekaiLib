using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class TitleCommentRepository : Repository<TitleComment>, ITitleCommentRepository
{
    public TitleCommentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<TitleComment>> GetCommentsByTitleIdAsync(Guid titleId)
    {
        return await _context.TitleComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .Where(c => c.TitleId == titleId && !c.ParentCommentId.HasValue)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<TitleComment?> GetCommentByIdAsync(Guid commentId)
    {
        return await _context.TitleComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .FirstOrDefaultAsync(c => c.Id == commentId);
    }

    public async Task AddCommentAsync(TitleComment comment)
    {
        await _context.TitleComments.AddAsync(comment);
    }

    public async Task RemoveCommentAsync(TitleComment comment)
    {
        _context.TitleComments.Remove(comment);
        await Task.CompletedTask;
    }

    public async Task<TitleCommentReaction?> GetCommentReactionAsync(Guid userId, Guid commentId)
    {
        return await _context.TitleCommentReactions
            .FirstOrDefaultAsync(r => r.UserId == userId && r.CommentId == commentId);
    }

    public async Task AddCommentReactionAsync(TitleCommentReaction reaction)
    {
        await _context.TitleCommentReactions.AddAsync(reaction);
    }

    public async Task RemoveCommentReactionAsync(TitleCommentReaction reaction)
    {
        _context.TitleCommentReactions.Remove(reaction);
        await Task.CompletedTask;
    }
}
