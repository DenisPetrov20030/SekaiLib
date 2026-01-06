namespace SekaiLib.Application.DTOs.Auth;

public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);
