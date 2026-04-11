namespace SekaiLib.Application.DTOs.Teams;

public record UpdateTeamRequest(
    string Name,
    string Description,
    string? AvatarUrl,
    string? CoverImageUrl
);
