using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Users;

public record FriendRequestDto(
    Guid Id,
    Guid FromUserId,
    string FromUsername,
    string? FromAvatarUrl,
    Guid ToUserId,
    FriendRequestStatus Status,
    DateTime CreatedAt
);
