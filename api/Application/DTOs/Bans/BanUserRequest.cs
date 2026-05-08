namespace SekaiLib.Application.DTOs.Bans;

public record BanUserRequest(string Reason, DateTime? ExpiresAt);
