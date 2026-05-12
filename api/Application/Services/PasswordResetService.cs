using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class PasswordResetService : IPasswordResetService
{
    private readonly IUnitOfWork _unitOfWork;

    public PasswordResetService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<string> RequestResetAsync(string email)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(email);

        // Не розкриваємо чи існує email — завжди 200
        if (user == null) return string.Empty;

        // Анулюємо старі токени
        var oldTokens = await _unitOfWork.PasswordResetTokens.Query()
            .Where(t => t.UserId == user.Id && !t.IsUsed)
            .ToListAsync();

        foreach (var old in oldTokens)
        {
            old.IsUsed = true;
            await _unitOfWork.PasswordResetTokens.UpdateAsync(old);
        }

        var rawToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        var resetToken = new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = rawToken,
            ExpiresAt = DateTime.UtcNow.AddHours(2),
            IsUsed = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.PasswordResetTokens.AddAsync(resetToken);
        await _unitOfWork.SaveChangesAsync();

        // TODO: надіслати email з посиланням /reset-password?token={rawToken}
        // Зараз повертаємо токен для dev-режиму
        return rawToken;
    }

    public async Task ResetAsync(string token, string newPassword)
    {
        ValidatePassword(newPassword);

        var resetToken = await _unitOfWork.PasswordResetTokens.Query()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            ?? throw new ValidationException("Token", "Недійсний або прострочений токен скидання пароля.");

        resetToken.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        resetToken.User.UpdatedAt = DateTime.UtcNow;
        resetToken.IsUsed = true;

        await _unitOfWork.PasswordResetTokens.UpdateAsync(resetToken);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId)
            ?? throw new NotFoundException("User", userId);

        if (string.IsNullOrEmpty(user.PasswordHash))
            throw new ValidationException("Password", "У вашому акаунті не встановлено пароль. Скористайтесь скиданням пароля.");

        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            throw new ValidationException("CurrentPassword", "Невірний поточний пароль.");

        ValidatePassword(newPassword);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, 12);
        user.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Users.UpdateAsync(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private static void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
            throw new ValidationException("NewPassword", "Пароль має містити щонайменше 6 символів.");
    }
}
