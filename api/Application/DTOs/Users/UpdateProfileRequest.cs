using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Users;

public record UpdateProfileRequest(
    string Username,
    Gender Gender,
    string? AboutMe,
    int[]? NotifyListStatuses = null,
    string[]? NotifyUserListIds = null,
    bool? NotifyTitleCompleted = null,
    bool? NotifyFriendRequests = null,
    int? ProfileVisibility = null,
    List<Guid>? BlockedGenreIds = null
);
