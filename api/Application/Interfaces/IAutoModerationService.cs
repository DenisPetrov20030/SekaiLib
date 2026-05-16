namespace SekaiLib.Application.Interfaces;

public record AutoModerationResult(bool IsFlagged, string? Reason);

public interface IAutoModerationService
{
    /// <summary>
    /// Checks text content against bad-word list, spam patterns, and caps abuse.
    /// Returns IsFlagged=true + a reason string if the content should be hidden.
    /// </summary>
    Task<AutoModerationResult> CheckAsync(string content);

    /// <summary>Invalidates the cached bad-word list (call after add/remove bad word).</summary>
    Task InvalidateCacheAsync();
}
