namespace SekaiLib.Application.DTOs.Users;

public record FriendDto(
    Guid Id,
    string Username,
    string? AvatarUrl
);
