using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly IExternalAuthTicketStore _externalAuthTicketStore;

    public AuthService(IUnitOfWork unitOfWork, ITokenService tokenService, IExternalAuthTicketStore externalAuthTicketStore)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _externalAuthTicketStore = externalAuthTicketStore;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (existingUser != null)
            throw new ValidationException("Email", "Email is already registered");

        var existingUsername = await _unitOfWork.Users.GetByUsernameAsync(request.Username);
        if (existingUsername != null)
            throw new ValidationException("Username", "Username is already taken");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, 12);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Username = request.Username,
            PasswordHash = passwordHash,
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user == null || string.IsNullOrWhiteSpace(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password");

        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> CompleteOAuthAsync(CompleteOAuthRequest request, CancellationToken cancellationToken)
    {
        var payload = await _externalAuthTicketStore.TakeAsync(request.Ticket, cancellationToken);
        if (payload is null)
        {
            throw new UnauthorizedException("Invalid oauth ticket");
        }

        var profile = payload.Value.Profile;
        var provider = profile.Provider.ToString().ToLowerInvariant();

        var externalLogin = await _unitOfWork.UserExternalLogins.Query()
            .FirstOrDefaultAsync(x => x.Provider == provider && x.ProviderUserId == profile.ProviderUserId, cancellationToken);

        User? user = null;
        if (externalLogin is not null)
        {
            user = await _unitOfWork.Users.GetByIdAsync(externalLogin.UserId);
        }

        if (user is null)
        {
            user = await _unitOfWork.Users.GetByEmailAsync(profile.Email);
        }

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = profile.Email,
                Username = await BuildUniqueUsernameAsync(profile.Username),
                PasswordHash = null,
                AvatarUrl = profile.AvatarUrl,
                Role = UserRole.User,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();
        }
        else
        {
            if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(profile.AvatarUrl))
            {
                user.AvatarUrl = profile.AvatarUrl;
                user.UpdatedAt = DateTime.UtcNow;
                await _unitOfWork.Users.UpdateAsync(user);
            }
        }

        var hasLink = await _unitOfWork.UserExternalLogins.Query()
            .AnyAsync(x => x.UserId == user.Id && x.Provider == provider, cancellationToken);

        if (!hasLink)
        {
            var link = new UserExternalLogin
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Provider = provider,
                ProviderUserId = profile.ProviderUserId,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.UserExternalLogins.AddAsync(link);
        }

        await _unitOfWork.SaveChangesAsync();
        return await IssueTokensAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _tokenService.ValidateRefreshTokenAsync(refreshToken);
        if (storedToken == null)
            throw new UnauthorizedException("Invalid refresh token");

        var user = await _unitOfWork.Users.GetByIdAsync(storedToken.UserId);
        if (user == null)
            throw new UnauthorizedException("User not found");

        var accessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();
        await _tokenService.SaveRefreshTokenAsync(user.Id, newRefreshToken);

        var userDto = new UserDto(user.Id, user.Email, user.Username, user.Role);
        return new AuthResponse(accessToken, newRefreshToken, userDto);
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("User", userId);

        return new UserDto(user.Id, user.Email, user.Username, user.Role);
    }

    private async Task<AuthResponse> IssueTokensAsync(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken);

        var userDto = new UserDto(user.Id, user.Email, user.Username, user.Role);
        return new AuthResponse(accessToken, refreshToken, userDto);
    }

    private async Task<string> BuildUniqueUsernameAsync(string preferredUsername)
    {
        var sanitized = string.Join(string.Empty, preferredUsername
            .Where(ch => char.IsLetterOrDigit(ch) || ch == '_'));

        if (string.IsNullOrWhiteSpace(sanitized))
        {
            sanitized = "user";
        }

        var candidate = sanitized.Length > 30 ? sanitized[..30] : sanitized;
        var suffix = 0;

        while (await _unitOfWork.Users.GetByUsernameAsync(candidate) is not null)
        {
            suffix++;
            var baseName = sanitized.Length > 24 ? sanitized[..24] : sanitized;
            candidate = $"{baseName}_{suffix}";
        }

        return candidate;
    }
}
