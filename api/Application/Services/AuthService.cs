using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;

    public AuthService(IUnitOfWork unitOfWork, ITokenService tokenService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
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

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken);

        var userDto = new UserDto(user.Id, user.Email, user.Username, user.Role);
        return new AuthResponse(accessToken, refreshToken, userDto);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password");

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken);

        var userDto = new UserDto(user.Id, user.Email, user.Username, user.Role);
        return new AuthResponse(accessToken, refreshToken, userDto);
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
}
