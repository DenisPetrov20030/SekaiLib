using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Ratings;

public record TitleRatingResponse(
    int LikesCount,
    int DislikesCount,
    ReactionType? UserRating
);
