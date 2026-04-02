using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Teams;

public record AddMemberRequest(Guid UserId, TeamMemberRole Role);
