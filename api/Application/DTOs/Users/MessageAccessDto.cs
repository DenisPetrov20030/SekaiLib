namespace SekaiLib.Application.DTOs.Users;

public record MessageAccessDto(
    bool CanMessage,
    bool BlockedByMe,
    bool BlockedByUser
);