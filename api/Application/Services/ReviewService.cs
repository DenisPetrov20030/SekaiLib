using SekaiLib.Application.DTOs.Reviews;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

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
        return MapToResponse(createdReview!, userId);
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
            review.UpdatedAt
        );
    }
}
