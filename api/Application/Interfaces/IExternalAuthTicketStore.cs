using SekaiLib.Application.DTOs.Auth;

namespace SekaiLib.Application.Interfaces;

public interface IExternalAuthTicketStore
{
    Task<string> CreateAsync(ExternalAuthUserProfile profile, string returnUrl, CancellationToken cancellationToken);
    Task<(ExternalAuthUserProfile Profile, string ReturnUrl)?> TakeAsync(string ticket, CancellationToken cancellationToken);
}
