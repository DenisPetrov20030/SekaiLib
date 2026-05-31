using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.DTOs.Notifications;

namespace SekaiLib.Application.Services;

public class TitleCommentService : ITitleCommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notifications;
    private readonly IUserBlockService _userBlockService;
    private readonly IAutoModerationService _autoMod;

    public TitleCommentService(IUnitOfWork unitOfWork, INotificationService notifications,
        IUserBlockService userBlockService, IAutoModerationService autoMod)
    {
        _unitOfWork = unitOfWork;
        _notifications = notifications;
        _userBlockService = userBlockService;
        _autoMod = autoMod;
    }

    public async Task<IEnumerable<TitleCommentResponse>> GetCommentsByTitleAsync(Guid titleId, Guid? currentUserId)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var comments = await _unitOfWork.TitleComments.GetCommentsByTitleIdAsync(titleId);

        if (currentUserId.HasValue)
        {
            var blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(currentUserId.Value)).ToHashSet();
            comments = comments.Where(c => !blockedIds.Contains(c.UserId)).ToList();
        }

        var byId = comments.ToDictionary(c => c.Id);
        var roots = new List<TitleComment>();
        foreach (var c in comments)
        {
            if (c.ParentCommentId.HasValue && byId.TryGetValue(c.ParentCommentId.Value, out var parent))
            {
                parent.Replies.Add(c);
            }
            else
            {
                roots.Add(c);
            }
        }

        TitleCommentResponse Map(TitleComment c)
        {
            var likes = c.Reactions.Count(r => r.Type == ReactionType.Like);
            var dislikes = c.Reactions.Count(r => r.Type == ReactionType.Dislike);
            var userReaction = currentUserId.HasValue
                ? c.Reactions.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Type
                : null;

            return new TitleCommentResponse(
                c.Id,
                c.UserId,
                c.User.Username,
                c.User.AvatarUrl,
                c.Content,
                c.CreatedAt,
                c.UpdatedAt,
                likes,
                dislikes,
                userReaction,
                c.ParentCommentId,
                c.Replies.OrderBy(r => r.CreatedAt).Select(Map)
            );
        }

        return roots.OrderBy(r => r.CreatedAt).Select(Map);
    }

    public async Task<TitleCommentResponse> AddCommentAsync(Guid userId, Guid titleId, CreateTitleCommentRequest request)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        if (request.ParentCommentId.HasValue)
        {
            var parent = await _unitOfWork.TitleComments.GetCommentByIdAsync(request.ParentCommentId.Value);
            if (parent == null)
                throw new NotFoundException("TitleComment", request.ParentCommentId.Value);

            if (await _userBlockService.IsBlockedAsync(parent.UserId, userId))
                throw new ForbiddenException("Ви не можете відповідати на коментарі цього користувача.");
        }

        var autoModResult = await _autoMod.CheckAsync(request.Content);
        if (autoModResult.IsFlagged)
            throw new ValidationException("Content", "Коментар містить заборонені слова або порушує правила спільноти.");

        var comment = new TitleComment
        {
            Id = Guid.NewGuid(),
            TitleId = titleId,
            UserId = userId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            ParentCommentId = request.ParentCommentId
        };

        await _unitOfWork.TitleComments.AddCommentAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        if (comment.ParentCommentId.HasValue)
        {
            var parent = await _unitOfWork.TitleComments.GetCommentByIdAsync(comment.ParentCommentId.Value);
            if (parent != null && parent.UserId != userId)
            {
                await _notifications.CreateAsync(new CreateNotificationRequest(
                    parent.UserId,
                    NotificationType.CommentReply,
                    "Відповідь на коментар",
                    $"{user.Username} відповів(ла) на ваш коментар до \"{title.Name}\"",
                    $"/titles/{titleId}#comment-{comment.Id}",
                    userId,
                    titleId,
                    null
                ));
            }
        }

        return new TitleCommentResponse(
            comment.Id,
            userId,
            user.Username,
            user.AvatarUrl,
            comment.Content,
            comment.CreatedAt,
            comment.UpdatedAt,
            0,
            0,
            null,
            comment.ParentCommentId,
            Enumerable.Empty<TitleCommentResponse>()
        );
    }

    public async Task<TitleCommentResponse> UpdateCommentAsync(Guid userId, Guid commentId, UpdateTitleCommentRequest request)
    {
        var comment = await _unitOfWork.TitleComments.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("TitleComment", commentId);

        if (comment.UserId != userId)
            throw new ForbiddenException();

        comment.Content = request.Content;
        comment.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync();

        return await BuildCommentResponse(commentId, userId);
    }

    public async Task<TitleCommentResponse> SetCommentReactionAsync(Guid userId, Guid commentId, ReactionType type)
    {
        var existing = await _unitOfWork.TitleComments.GetCommentReactionAsync(userId, commentId);
        if (existing != null)
        {
            if (existing.Type == type)
            {
                return await BuildCommentResponse(commentId, userId);
            }

            existing.Type = type;
            await _unitOfWork.SaveChangesAsync();
            return await BuildCommentResponse(commentId, userId);
        }

        var reaction = new TitleCommentReaction
        {
            Id = Guid.NewGuid(),
            CommentId = commentId,
            UserId = userId,
            Type = type,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.TitleComments.AddCommentReactionAsync(reaction);
        await _unitOfWork.SaveChangesAsync();

        return await BuildCommentResponse(commentId, userId);
    }

    public async Task RemoveCommentReactionAsync(Guid userId, Guid commentId)
    {
        var reaction = await _unitOfWork.TitleComments.GetCommentReactionAsync(userId, commentId);
        if (reaction == null)
            throw new NotFoundException("TitleCommentReaction", commentId);

        await _unitOfWork.TitleComments.RemoveCommentReactionAsync(reaction);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteCommentAsync(Guid userId, Guid commentId, bool isAdmin)
    {
        var comment = await _unitOfWork.TitleComments.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("TitleComment", commentId);

        if (comment.UserId != userId && !isAdmin)
            throw new ForbiddenException();

        await _unitOfWork.TitleComments.RemoveCommentAsync(comment);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<TitleCommentResponse> BuildCommentResponse(Guid commentId, Guid currentUserId)
    {
        var comment = await _unitOfWork.TitleComments.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("TitleComment", commentId);

        var all = await _unitOfWork.TitleComments.GetCommentsByTitleIdAsync(comment.TitleId);
        var blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(currentUserId)).ToHashSet();
        all = all.Where(c => !blockedIds.Contains(c.UserId)).ToList();

        var dict = all.ToDictionary(c => c.Id);
        foreach (var c in all)
        {
            if (c.ParentCommentId.HasValue && dict.TryGetValue(c.ParentCommentId.Value, out var parent))
                parent.Replies.Add(c);
        }

        TitleCommentResponse Map(TitleComment c)
        {
            var likes = c.Reactions.Count(r => r.Type == ReactionType.Like);
            var dislikes = c.Reactions.Count(r => r.Type == ReactionType.Dislike);
            var userReaction = c.Reactions.FirstOrDefault(r => r.UserId == currentUserId)?.Type;
            return new TitleCommentResponse(
                c.Id,
                c.UserId,
                c.User.Username,
                c.User.AvatarUrl,
                c.Content,
                c.CreatedAt,
                c.UpdatedAt,
                likes,
                dislikes,
                userReaction,
                c.ParentCommentId,
                c.Replies.OrderBy(r => r.CreatedAt).Select(Map)
            );
        }

        var root = all.FirstOrDefault(c => c.Id == commentId) ?? (all.FirstOrDefault(c => c.Replies.Any(r => r.Id == commentId)) ?? comment);
        return Map(root);
    }
}
