using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.Auth;

public record UserDto(Guid Id, string Email, string Username, UserRole Role);
