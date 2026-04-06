using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Options;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IExternalAuthService _externalAuthService;
    private readonly OAuthOptions _oAuthOptions;

    public AuthController(IAuthService authService, IExternalAuthService externalAuthService, IOptions<OAuthOptions> oAuthOptions)
    {
        _authService = authService;
        _externalAuthService = externalAuthService;
        _oAuthOptions = oAuthOptions.Value;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        return Ok(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    [HttpPost("oauth/complete")]
    public async Task<ActionResult<AuthResponse>> CompleteOAuth([FromBody] CompleteOAuthRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.CompleteOAuthAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshTokenRequest request)
    {
        var response = await _authService.RefreshTokenAsync(request.RefreshToken);
        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _authService.GetCurrentUserAsync(userId);
        return Ok(user);
    }

    [HttpGet("oauth/{provider}/start")]
    public async Task<IActionResult> StartOAuth([FromRoute] string provider, [FromQuery] string? returnUrl, CancellationToken cancellationToken)
    {
        if (!TryParseProvider(provider, out var parsedProvider))
        {
            return BadRequest(new { message = "Unsupported provider" });
        }

        var callbackUrl = BuildCallbackUrl(provider);
        var targetReturnUrl = NormalizeReturnUrl(returnUrl);
        var result = await _externalAuthService.StartAsync(parsedProvider, targetReturnUrl, callbackUrl, cancellationToken);
        return Redirect(result.AuthorizationUrl);
    }

    [HttpGet("oauth/{provider}/callback")]
    public async Task<IActionResult> OAuthCallback(
        [FromRoute] string provider,
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        CancellationToken cancellationToken)
    {
        if (!TryParseProvider(provider, out var parsedProvider))
        {
            return Redirect(BuildFrontendCallbackUrl(errorMessage: "unsupported_provider"));
        }

        if (!string.IsNullOrWhiteSpace(error) || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state))
        {
            return Redirect(BuildFrontendCallbackUrl(errorMessage: "oauth_failed"));
        }

        try
        {
            var callbackUrl = BuildCallbackUrl(provider);
            var result = await _externalAuthService.HandleCallbackAsync(
                new OAuthCallbackRequest(parsedProvider, code, state),
                callbackUrl,
                cancellationToken);

            return Redirect(BuildFrontendCallbackUrl(result.Ticket, NormalizeReturnUrl(result.ReturnUrl)));
        }
        catch
        {
            return Redirect(BuildFrontendCallbackUrl(errorMessage: "oauth_failed"));
        }
    }

    private string BuildCallbackUrl(string provider)
    {
        return Url.ActionLink(nameof(OAuthCallback), values: new { provider })!;
    }

    private string BuildFrontendCallbackUrl(string? ticket = null, string? returnUrl = null, string? errorMessage = null)
    {
        var query = new Dictionary<string, string?>();
        if (!string.IsNullOrWhiteSpace(ticket))
        {
            query["ticket"] = ticket;
        }

        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            query["returnUrl"] = returnUrl;
        }

        if (!string.IsNullOrWhiteSpace(errorMessage))
        {
            query["error"] = errorMessage;
        }

        return QueryHelpers.AddQueryString(_oAuthOptions.FrontendCallbackBaseUrl, query!);
    }

    private static string NormalizeReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl))
        {
            return "/catalog";
        }

        return returnUrl.StartsWith('/') ? returnUrl : "/catalog";
    }

    private static bool TryParseProvider(string provider, out ExternalAuthProvider parsedProvider)
    {
        if (provider.Equals("google", StringComparison.OrdinalIgnoreCase))
        {
            parsedProvider = ExternalAuthProvider.Google;
            return true;
        }

        parsedProvider = default;
        return false;
    }
}
