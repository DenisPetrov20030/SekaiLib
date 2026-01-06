namespace SekaiLib.Application.DTOs.Titles;

public record UserProfileDto(
    Guid Id,
    string Username,
    string Email,
    string? AvatarUrl,
    DateTime CreatedAt
);
