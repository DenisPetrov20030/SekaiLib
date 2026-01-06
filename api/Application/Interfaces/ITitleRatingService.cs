using SekaiLib.Application.DTOs.Ratings;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Interfaces;

public interface ITitleRatingService
{
    Task<TitleRatingResponse> GetRatingAsync(Guid titleId, Guid? currentUserId);
    Task<TitleRatingResponse> SetRatingAsync(Guid userId, Guid titleId, ReactionType type);
    Task<TitleRatingResponse> RemoveRatingAsync(Guid userId, Guid titleId);
}
