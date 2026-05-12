using SekaiLib.Application.DTOs.Auth;

namespace SekaiLib.Application.Interfaces;

public interface IAccountLinkService
{
    Task<IEnumerable<LinkedAccountDto>> GetLinkedAccountsAsync(Guid userId);
    Task UnlinkAccountAsync(Guid userId, string provider);
}
