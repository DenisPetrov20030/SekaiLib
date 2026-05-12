namespace SekaiLib.Application.DTOs.Auth;

public record LinkedAccountDto(string Provider, string ProviderUserId, DateTime LinkedAt);
