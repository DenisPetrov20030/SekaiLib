namespace SekaiLib.Application.Interfaces;

public interface IPasswordResetService
{
    /// <summary>Генерує токен скидання пароля. Повертає токен (в dev — для тестування).</summary>
    Task<string> RequestResetAsync(string email);

    /// <summary>Перевіряє токен і встановлює новий пароль.</summary>
    Task ResetAsync(string token, string newPassword);

    /// <summary>Змінює пароль авторизованого користувача.</summary>
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword);
}
