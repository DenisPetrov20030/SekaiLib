namespace SekaiLib.Application.DTOs.Users;

public record BlockedUserDto(Guid UserId, string Username, string? AvatarUrl, DateTime BlockedAt);
