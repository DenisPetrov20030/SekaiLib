namespace SekaiLib.Application.DTOs.Auth;

public record OAuthCallbackResult(string Ticket, string ReturnUrl);
