using System.Security.Cryptography;
using System.Text;
using SekaiLib.Application.DTOs.Reviews;
using SekaiLib.Application.DTOs.Notifications;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SekaiLib.Application.Services;

public class ReviewService : IReviewService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notifications;
    private readonly IUserBlockService _userBlockService;
    private readonly IAutoModerationService _autoMod;
    private readonly IModerationService _moderation;

    public ReviewService(IUnitOfWork unitOfWork, INotificationService notifications,
        IUserBlockService userBlockService, IAutoModerationService autoMod, IModerationService moderation)
    {
        _unitOfWork = unitOfWork;
        _notifications = notifications;
        _userBlockService = userBlockService;
        _autoMod = autoMod;
        _moderation = moderation;
    }

    public async Task<IEnumerable<ReviewResponse>> GetByTitleAsync(Guid titleId, Guid? currentUserId)
    {
        var reviews = await _unitOfWork.Reviews.GetByTitleIdAsync(titleId);
        var reviewsList = reviews.ToList();
        var userIds = reviewsList.Select(r => r.UserId).Distinct();
        var scores = await _unitOfWork.Reviews.GetReviewerScoresAsync(userIds);
        return reviewsList.Select(r =>
        {
            scores.TryGetValue(r.UserId, out var score);
            return MapToResponse(r, currentUserId, score, null);
        });
    }

    public async Task<ReviewResponse> GetByIdAsync(Guid titleId, Guid reviewId, Guid? currentUserId, string ipAddress)
    {
        var review = await _unitOfWork.Reviews.GetByTitleIdAsync(titleId);
        var target = review.FirstOrDefault(r => r.Id == reviewId);

        if (target == null)
            throw new NotFoundException("Review", reviewId);

        if (await RecordViewAsync(target.Id, currentUserId, ipAddress))
        {
            target.ViewCount++;
            await _unitOfWork.Reviews.UpdateAsync(target);
        }

        await _unitOfWork.SaveChangesAsync();

        var refreshed = await _unitOfWork.Reviews.GetByTitleIdAsync(titleId);
        var updatedReview = refreshed.FirstOrDefault(r => r.Id == reviewId) ?? target;
        var reviewerScore = await _unitOfWork.Reviews.GetReviewerScoreAsync(updatedReview.UserId);
        HashSet<Guid>? blockedIds = null;
        if (currentUserId.HasValue)
            blockedIds = (await _userBlockService.GetBlockedUserIdsAsync(currentUserId.Value)).ToHashSet();

        return MapToResponse(updatedReview, currentUserId, reviewerScore, blockedIds);
    }

    private async Task<bool> RecordViewAsync(Guid reviewId, Guid? userId, string ipAddress)
    {
        var ipHash = HashIp(ipAddress);

        var alreadyViewed = userId.HasValue
            ? await _unitOfWork.ReviewViews.Query().AnyAsync(v => v.ReviewId == reviewId && v.UserId == userId.Value)
            : await _unitOfWork.ReviewViews.Query().AnyAsync(v => v.ReviewId == reviewId && v.UserId == null && v.IpHash == ipHash);

        if (alreadyViewed)
            return false;

        await _unitOfWork.ReviewViews.AddAsync(new ReviewView
        {
            Id = Guid.NewGuid(),
            ReviewId = reviewId,
            UserId = userId,
            IpHash = ipHash,
            ViewedAt = DateTime.UtcNow
        });

        return true;
    }

    private static string HashIp(string ip)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(bytes)[..16];
    }

    public async Task<ReviewResponse> CreateAsync(Guid userId, Guid titleId, CreateReviewRequest request)
    {
        var reviewTitle = request.Title?.Trim() ?? string.Empty;
        var content = request.Content?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(reviewTitle))
            throw new ValidationException(nameof(request.Title), "Заголовок рецензії не може бути порожнім");

        if (reviewTitle.Length > 200)
            throw new ValidationException(nameof(request.Title), "Зменшіть кількість символів у заголовку рецензії");

        if (string.IsNullOrWhiteSpace(content))
            throw new ValidationException(nameof(request.Content), "Рецензія не може бути порожньою");

        if (content.Length > 2000)
            throw new ValidationException(nameof(request.Content), "Зменшіть кількість символів у рецензії");

        var existingReview = await _unitOfWork.Reviews.GetByUserAndTitleAsync(userId, titleId);
        if (existingReview != null)
            throw new ValidationException(new Dictionary<string, string[]> { { "Review", new[] { "You have already reviewed this title" } } });

        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var autoModResult = await _autoMod.CheckAsync(reviewTitle + "\n" + content);
        var isHidden = autoModResult.IsFlagged;

        var review = new Review
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TitleId = titleId,
            ReviewTitle = reviewTitle,
            Content = content,
            Rating = Math.Clamp(request.Rating, 1, 10),
            IsHidden = isHidden,
            ViewCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Reviews.AddAsync(review);

        if (isHidden)
            await _moderation.EnqueueAsync("Review", review.Id, reviewTitle + "\n" + content,
                userId, autoModResult.Reason ?? "automod");

        await _unitOfWork.SaveChangesAsync();

        var createdReview = await _unitOfWork.Reviews.GetByUserAndTitleAsync(userId, titleId);
        if (createdReview == null)
            throw new NotFoundException("Review", userId);

        if (createdReview.User == null)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(createdReview.UserId);
            if (user != null)
            {
                createdReview.User = user;
            }
        }

        var reviewerScore = await _unitOfWork.Reviews.GetReviewerScoreAsync(userId);
        return MapToResponse(createdReview, userId, reviewerScore, null);
    }

    public async Task<ReviewResponse> UpdateAsync(Guid userId, Guid reviewId, UpdateReviewRequest request)
    {
        var title = request.Title?.Trim() ?? string.Empty;
        var content = request.Content?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(title))
            throw new ValidationException(nameof(request.Title), "Заголовок рецензії не може бути порожнім");

        if (title.Length > 200)
            throw new ValidationException(nameof(request.Title), "Зменшіть кількість символів у заголовку рецензії");

        if (string.IsNullOrWhiteSpace(content))
            throw new ValidationException(nameof(request.Content), "Рецензія не може бути порожньою");

        if (content.Length > 2000)
            throw new ValidationException(nameof(request.Content), "Зменшіть кількість символів у рецензії");

        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null)
            throw new NotFoundException("Review", reviewId);

        if (review.UserId != userId)
            throw new ForbiddenException("You can only edit your own reviews");

        review.ReviewTitle = title;
        review.Content = content;
        review.Rating = Math.Clamp(request.Rating, 1, 10);
        review.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Reviews.UpdateAsync(review);
        await _unitOfWork.SaveChangesAsync();

        var updatedReview = await _unitOfWork.Reviews.GetByUserAndTitleAsync(userId, review.TitleId);
        var reviewerScore = await _unitOfWork.Reviews.GetReviewerScoreAsync(userId);
        return MapToResponse(updatedReview!, userId, reviewerScore, null);
    }

    public async Task DeleteAsync(Guid userId, Guid reviewId, bool isAdmin)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null)
            throw new NotFoundException("Review", reviewId);

        if (review.UserId != userId && !isAdmin)
            throw new ForbiddenException("You can only delete your own reviews");

        await _unitOfWork.Reviews.DeleteAsync(review);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<ReviewResponse> SetReactionAsync(Guid userId, Guid reviewId, ReactionType type)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null)
            throw new NotFoundException("Review", reviewId);

        var existingReaction = await _unitOfWork.Reviews.GetReactionAsync(userId, reviewId);
        
        if (existingReaction != null)
        {
            if (existingReaction.Type == type)
            {
                await _unitOfWork.Reviews.RemoveReactionAsync(existingReaction);
            }
            else
            {
                existingReaction.Type = type;
            }
        }
        else
        {
            var reaction = new ReviewReaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ReviewId = reviewId,
                Type = type,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Reviews.AddReactionAsync(reaction);
        }

        await _unitOfWork.SaveChangesAsync();

        var updatedReview = await _unitOfWork.Reviews.GetByUserAndTitleAsync(review.UserId, review.TitleId);
        var reviewerScore = await _unitOfWork.Reviews.GetReviewerScoreAsync(review.UserId);
        return MapToResponse(updatedReview!, userId, reviewerScore, null);
    }

    public async Task RemoveReactionAsync(Guid userId, Guid reviewId)
    {
        var reaction = await _unitOfWork.Reviews.GetReactionAsync(userId, reviewId);
        if (reaction != null)
        {
            await _unitOfWork.Reviews.RemoveReactionAsync(reaction);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    private ReviewResponse MapToResponse(Review review, Guid? currentUserId, int reviewerScore = 0, HashSet<Guid>? blockedIds = null)
    {
        var likesCount = review.Reactions?.Count(r => r.Type == ReactionType.Like) ?? 0;
        var dislikesCount = review.Reactions?.Count(r => r.Type == ReactionType.Dislike) ?? 0;
        var userReaction = currentUserId.HasValue
            ? review.Reactions?.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Type
            : null;

        var allComments = (review.Comments ?? new List<ReviewComment>())
            .OrderByDescending(c => c.CreatedAt)
            .ToList();

        if (blockedIds is { Count: > 0 })
            allComments = allComments.Where(c => !blockedIds.Contains(c.UserId)).ToList();

        ReviewCommentResponse MapComment(ReviewComment c)
        {
            var clikes = c.Reactions?.Count(r => r.Type == ReactionType.Like) ?? 0;
            var cdislikes = c.Reactions?.Count(r => r.Type == ReactionType.Dislike) ?? 0;
            var cuserReaction = currentUserId.HasValue
                ? c.Reactions?.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Type
                : null;

            var childReplies = allComments
                .Where(x => x.ParentCommentId == c.Id)
                .OrderByDescending(x => x.CreatedAt)
                .Select(MapComment)
                .ToList();

            return new ReviewCommentResponse(
                c.Id,
                c.UserId,
                c.User?.Username ?? "Unknown",
                c.User?.AvatarUrl,
                c.Content,
                c.CreatedAt,
                clikes,
                cdislikes,
                cuserReaction,
                c.ParentCommentId,
                childReplies
            );
        }

        var comments = allComments
            .Where(c => c.ParentCommentId == null)
            .Select(MapComment)
            .ToList();

        var commentsCount = allComments.Count(c => c.ParentCommentId == null);

        return new ReviewResponse(
            review.Id,
            review.UserId,
            review.User?.Username ?? "Unknown",
            review.User?.AvatarUrl,
            review.TitleId,
            review.ReviewTitle,
            review.Content,
            review.Rating,
            likesCount,
            dislikesCount,
            review.ViewCount,
            commentsCount,
            userReaction,
            review.CreatedAt,
            review.UpdatedAt,
            comments,
            reviewerScore
        );
    }

    public async Task<ReviewCommentResponse> AddCommentAsync(Guid userId, Guid reviewId, CreateReviewCommentRequest request)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null)
            throw new NotFoundException("Review", reviewId);

        if (request.ParentCommentId.HasValue)
        {
            var parent = await _unitOfWork.Reviews.GetCommentByIdAsync(request.ParentCommentId.Value);
            if (parent == null)
                throw new NotFoundException("ReviewComment", request.ParentCommentId.Value);

            if (await _userBlockService.IsBlockedAsync(parent.UserId, userId))
                throw new ForbiddenException("Ви не можете відповідати на коментарі цього користувача.");
        }

        var comment = new ReviewComment
        {
            Id = Guid.NewGuid(),
            ReviewId = reviewId,
            UserId = userId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            ParentCommentId = request.ParentCommentId
        };

        await _unitOfWork.Reviews.AddCommentAsync(comment);
        await _unitOfWork.SaveChangesAsync();

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (comment.ParentCommentId.HasValue && user != null)
        {
            var parent = await _unitOfWork.Reviews.GetCommentByIdAsync(comment.ParentCommentId.Value);
            if (parent != null && parent.UserId != userId)
            {
                await _notifications.CreateAsync(new CreateNotificationRequest(
                    parent.UserId,
                    NotificationType.CommentReply,
                    "Відповідь на коментар",
                    $"{user.Username} відповів(ла) на ваш коментар",
                    $"/titles/{review.TitleId}#comment-{comment.Id}",
                    userId,
                    review.TitleId
                ));
            }
        }
        else if (!comment.ParentCommentId.HasValue && user != null && review.UserId != userId)
        {
            await _notifications.CreateAsync(new CreateNotificationRequest(
                review.UserId,
                NotificationType.CommentReply,
                "Новий коментар до рецензії",
                $"{user.Username} відповів(ла) на вашу рецензію",
                $"/titles/{review.TitleId}#comment-{comment.Id}",
                userId,
                review.TitleId
            ));
        }
        return new ReviewCommentResponse(
            comment.Id,
            comment.UserId,
            user?.Username ?? "Unknown",
            user?.AvatarUrl,
            comment.Content,
            comment.CreatedAt,
            0,
            0,
            null,
            comment.ParentCommentId,
            Enumerable.Empty<ReviewCommentResponse>()
        );
    }

    public async Task<ReviewCommentResponse> UpdateCommentAsync(Guid userId, Guid commentId, UpdateReviewCommentRequest request)
    {
        var entity = await _unitOfWork.Reviews.GetCommentByIdAsync(commentId);
        if (entity == null)
            throw new NotFoundException("ReviewComment", commentId);

        if (entity.UserId != userId)
            throw new ForbiddenException("You can only edit your own comments");

        entity.Content = request.Content;
        await _unitOfWork.SaveChangesAsync();

        var likes = entity.Reactions?.Count(r => r.Type == ReactionType.Like) ?? 0;
        var dislikes = entity.Reactions?.Count(r => r.Type == ReactionType.Dislike) ?? 0;
        var user = await _unitOfWork.Users.GetByIdAsync(entity.UserId);
        var userReaction = await _unitOfWork.Reviews.GetCommentReactionAsync(userId, commentId);

        return new ReviewCommentResponse(
            entity.Id,
            entity.UserId,
            user?.Username ?? "Unknown",
            user?.AvatarUrl,
            entity.Content,
            entity.CreatedAt,
            likes,
            dislikes,
            userReaction?.Type,
            entity.ParentCommentId,
            Enumerable.Empty<ReviewCommentResponse>()
        );
    }

    public async Task<ReviewCommentResponse> SetCommentReactionAsync(Guid userId, Guid commentId, ReactionType type)
    {
        var entity = await _unitOfWork.Reviews.Query()
            .SelectMany(r => r.Comments)
            .FirstOrDefaultAsync(c => c.Id == commentId);
        if (entity == null)
            throw new NotFoundException("ReviewComment", commentId);

        var existing = await _unitOfWork.Reviews.GetCommentReactionAsync(userId, commentId);
        if (existing != null)
        {
            if (existing.Type == type)
            {
                await _unitOfWork.Reviews.RemoveCommentReactionAsync(existing);
            }
            else
            {
                existing.Type = type;
            }
        }
        else
        {
            var reaction = new ReviewCommentReaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CommentId = commentId,
                Type = type,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.Reviews.AddCommentReactionAsync(reaction);
        }

        await _unitOfWork.SaveChangesAsync();

        var likes = entity.Reactions?.Count(r => r.Type == ReactionType.Like) ?? 0;
        var dislikes = entity.Reactions?.Count(r => r.Type == ReactionType.Dislike) ?? 0;
        var user = await _unitOfWork.Users.GetByIdAsync(entity.UserId);
        var userReaction = await _unitOfWork.Reviews.GetCommentReactionAsync(userId, commentId);

        return new ReviewCommentResponse(
            entity.Id,
            entity.UserId,
            user?.Username ?? "Unknown",
            user?.AvatarUrl,
            entity.Content,
            entity.CreatedAt,
            likes,
            dislikes,
            userReaction?.Type,
            entity.ParentCommentId,
            Enumerable.Empty<ReviewCommentResponse>()
        );
    }

    public async Task RemoveCommentReactionAsync(Guid userId, Guid commentId)
    {
        var existing = await _unitOfWork.Reviews.GetCommentReactionAsync(userId, commentId);
        if (existing != null)
        {
            await _unitOfWork.Reviews.RemoveCommentReactionAsync(existing);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task DeleteCommentAsync(Guid userId, Guid commentId, bool isAdmin)
    {
        var comment = await _unitOfWork.Reviews.GetCommentByIdAsync(commentId);
        if (comment == null)
            throw new NotFoundException("ReviewComment", commentId);

        if (comment.UserId != userId && !isAdmin)
            throw new ForbiddenException("You can only delete your own comments");

        await _unitOfWork.Reviews.RemoveCommentAsync(comment);
        await _unitOfWork.SaveChangesAsync();
    }
}
