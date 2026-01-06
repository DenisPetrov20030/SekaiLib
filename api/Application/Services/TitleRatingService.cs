using SekaiLib.Application.DTOs.Ratings;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class TitleRatingService : ITitleRatingService
{
    private readonly IUnitOfWork _unitOfWork;

    public TitleRatingService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TitleRatingResponse> GetRatingAsync(Guid titleId, Guid? currentUserId)
    {
        var likesCount = await _unitOfWork.TitleRatings.GetLikesCountAsync(titleId);
        var dislikesCount = await _unitOfWork.TitleRatings.GetDislikesCountAsync(titleId);
        
        ReactionType? userRating = null;
        if (currentUserId.HasValue)
        {
            var rating = await _unitOfWork.TitleRatings.GetByUserAndTitleAsync(currentUserId.Value, titleId);
            userRating = rating?.Type;
        }

        return new TitleRatingResponse(likesCount, dislikesCount, userRating);
    }

    public async Task<TitleRatingResponse> SetRatingAsync(Guid userId, Guid titleId, ReactionType type)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var existingRating = await _unitOfWork.TitleRatings.GetByUserAndTitleAsync(userId, titleId);

        if (existingRating != null)
        {
            if (existingRating.Type == type)
            {
                await _unitOfWork.TitleRatings.DeleteAsync(existingRating);
            }
            else
            {
                existingRating.Type = type;
                await _unitOfWork.TitleRatings.UpdateAsync(existingRating);
            }
        }
        else
        {
            var rating = new TitleRating
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TitleId = titleId,
                Type = type,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.TitleRatings.AddAsync(rating);
        }

        await _unitOfWork.SaveChangesAsync();
        return await GetRatingAsync(titleId, userId);
    }

    public async Task<TitleRatingResponse> RemoveRatingAsync(Guid userId, Guid titleId)
    {
        var rating = await _unitOfWork.TitleRatings.GetByUserAndTitleAsync(userId, titleId);
        if (rating != null)
        {
            await _unitOfWork.TitleRatings.DeleteAsync(rating);
            await _unitOfWork.SaveChangesAsync();
        }

        return await GetRatingAsync(titleId, userId);
    }
}
