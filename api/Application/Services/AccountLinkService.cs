using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class AccountLinkService : IAccountLinkService
{
    private readonly IUnitOfWork _unitOfWork;

    public AccountLinkService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<LinkedAccountDto>> GetLinkedAccountsAsync(Guid userId)
    {
        var logins = await _unitOfWork.UserExternalLogins.Query()
            .Where(l => l.UserId == userId)
            .OrderBy(l => l.Provider)
            .ToListAsync();

        return logins.Select(l => new LinkedAccountDto(l.Provider, l.ProviderUserId, l.CreatedAt));
    }

    public async Task UnlinkAccountAsync(Guid userId, string provider)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        var login = await _unitOfWork.UserExternalLogins.Query()
            .FirstOrDefaultAsync(l => l.UserId == userId && l.Provider == provider.ToLowerInvariant())
            ?? throw new NotFoundException($"Linked account '{provider}' not found.");

        // Не дозволяємо відв'язати якщо це єдиний спосіб входу
        var hasPassword = !string.IsNullOrEmpty(user.PasswordHash);
        var otherLogins = await _unitOfWork.UserExternalLogins.Query()
            .CountAsync(l => l.UserId == userId && l.Provider != provider.ToLowerInvariant());

        if (!hasPassword && otherLogins == 0)
            throw new ValidationException("Provider",
                "Неможливо відв'язати єдиний спосіб входу. Спочатку встановіть пароль.");

        await _unitOfWork.UserExternalLogins.DeleteAsync(login);
        await _unitOfWork.SaveChangesAsync();
    }
}
