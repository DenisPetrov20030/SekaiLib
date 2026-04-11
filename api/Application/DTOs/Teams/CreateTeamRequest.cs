namespace SekaiLib.Application.DTOs.Teams;

public record CreateTeamRequest(
    string Name,
    string Description,
    string? AvatarUrl,
    string? CoverImageUrl
);
