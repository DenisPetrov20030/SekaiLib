namespace SekaiLib.Application.DTOs.Titles;

public record PublisherDto(
    Guid Id,
    string Username,
    string? AvatarUrl
);
