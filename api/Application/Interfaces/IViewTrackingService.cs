namespace SekaiLib.Application.Interfaces;

public interface IViewTrackingService
{
    /// <summary>
    /// Returns true if this is a new unique view (should increment counter).
    /// Deduplicates by userId (if authenticated) or hashed IP, with 24h cooldown.
    /// </summary>
    Task<bool> TryRecordViewAsync(string entityType, Guid entityId, Guid? userId, string? ipAddress);
}
