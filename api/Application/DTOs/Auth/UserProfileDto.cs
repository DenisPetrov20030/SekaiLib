using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Titles;

public record UserProfileDto(
    Guid Id,
    string Username,
    string Email,
    string? AvatarUrl,
    DateTime CreatedAt,
    Gender Gender,
    string? AboutMe,
    int[] NotifyListStatuses = default!,
    string[] NotifyUserListIds = default!,
    bool NotifyTitleCompleted = false,
    bool NotifyFriendRequests = false,
    int ProfileVisibility = 0,
    Guid[]? BlockedGenres = null
);
