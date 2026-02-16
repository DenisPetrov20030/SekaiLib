using SekaiLib.Application.DTOs.Reviews;
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

    public ReviewService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ReviewResponse>> GetByTitleAsync(Guid titleId, Guid? currentUserId)
    {
        var reviews = await _unitOfWork.Reviews.GetByTitleIdAsync(titleId);
        return reviews.Select(r => MapToResponse(r, currentUserId));
    }

    public async Task<ReviewResponse> CreateAsync(Guid userId, Guid titleId, CreateReviewRequest request)
    {
        var existingReview = await _unitOfWork.Reviews.GetByUserAndTitleAsync(userId, titleId);
        if (existingReview != null)
            throw new ValidationException(new Dictionary<string, string[]> { { "Review", new[] { "You have already reviewed this title" } } });

        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var review = new Review
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TitleId = titleId,
            Content = request.Content,
            Rating = Math.Clamp(request.Rating, 1, 10),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Reviews.AddAsync(review);
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

        return MapToResponse(createdReview, userId);
    }

    public async Task<ReviewResponse> UpdateAsync(Guid userId, Guid reviewId, UpdateReviewRequest request)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null)
            throw new NotFoundException("Review", reviewId);

        if (review.UserId != userId)
            throw new ForbiddenException("You can only edit your own reviews");

        review.Content = request.Content;
        review.Rating = Math.Clamp(request.Rating, 1, 10);
        review.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Reviews.UpdateAsync(review);
        await _unitOfWork.SaveChangesAsync();

        var updatedReview = await _unitOfWork.Reviews.GetByUserAndTitleAsync(userId, review.TitleId);
        return MapToResponse(updatedReview!, userId);
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
        return MapToResponse(updatedReview!, userId);
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

    private static ReviewResponse MapToResponse(Review review, Guid? currentUserId)
    {
        var likesCount = review.Reactions?.Count(r => r.Type == ReactionType.Like) ?? 0;
        var dislikesCount = review.Reactions?.Count(r => r.Type == ReactionType.Dislike) ?? 0;
        var userReaction = currentUserId.HasValue
            ? review.Reactions?.FirstOrDefault(r => r.UserId == currentUserId.Value)?.Type
            : null;

        // Build nested comments tree
        var allComments = (review.Comments ?? new List<ReviewComment>())
            .OrderByDescending(c => c.CreatedAt)
            .ToList();

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

        return new ReviewResponse(
            review.Id,
            review.UserId,
            review.User?.Username ?? "Unknown",
            review.User?.AvatarUrl,
            review.TitleId,
            review.Content,
            review.Rating,
            likesCount,
            dislikesCount,
            userReaction,
            review.CreatedAt,
            review.UpdatedAt,
            comments
        );
    }

    public async Task<ReviewCommentResponse> AddCommentAsync(Guid userId, Guid reviewId, CreateReviewCommentRequest request)
    {
        var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
        if (review == null)
            throw new NotFoundException("Review", reviewId);

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

        // Load user to populate response
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
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
        // Fetch single comment by id via repository query
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
