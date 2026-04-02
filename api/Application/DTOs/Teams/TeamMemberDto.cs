using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Teams;

public record TeamMemberDto(
    Guid UserId,
    string Username,
    string? AvatarUrl,
    TeamMemberRole Role,
    DateTime JoinedAt
);
