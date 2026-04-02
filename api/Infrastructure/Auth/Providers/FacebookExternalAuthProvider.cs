using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Options;

namespace SekaiLib.Infrastructure.Auth.Providers;

public class FacebookExternalAuthProvider : IExternalAuthProvider
{
    private readonly HttpClient _httpClient;
    private readonly OAuthOptions _options;

    public FacebookExternalAuthProvider(HttpClient httpClient, IOptions<OAuthOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public ExternalAuthProvider Provider => ExternalAuthProvider.Facebook;

    public Task<string> BuildAuthorizationUrlAsync(string state, string codeChallenge, string redirectUri, CancellationToken cancellationToken)
    {
        var query = new Dictionary<string, string>
        {
            ["client_id"] = _options.Facebook.ClientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = "email,public_profile",
            ["state"] = state,
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = "S256"
        };

        return Task.FromResult(BuildUrl(_options.Facebook.AuthorizeUrl, query));
    }

    public async Task<ExternalAuthUserProfile> GetUserProfileAsync(string code, string codeVerifier, string redirectUri, CancellationToken cancellationToken)
    {
        var tokenUrl = BuildUrl(_options.Facebook.TokenUrl, new Dictionary<string, string>
        {
            ["client_id"] = _options.Facebook.ClientId,
            ["client_secret"] = _options.Facebook.ClientSecret,
            ["redirect_uri"] = redirectUri,
            ["code"] = code,
            ["code_verifier"] = codeVerifier
        });

        var tokenResponse = await _httpClient.GetAsync(tokenUrl, cancellationToken);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            throw new UnauthorizedException("Facebook authentication failed");
        }

        var token = await tokenResponse.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken: cancellationToken);
        if (token is null || string.IsNullOrWhiteSpace(token.AccessToken))
        {
            throw new UnauthorizedException("Facebook authentication failed");
        }

        var userInfoUrl = BuildUrl(_options.Facebook.UserInfoUrl, new Dictionary<string, string>
        {
            ["access_token"] = token.AccessToken
        });

        var userInfoResponse = await _httpClient.GetAsync(userInfoUrl, cancellationToken);
        if (!userInfoResponse.IsSuccessStatusCode)
        {
            throw new UnauthorizedException("Facebook profile request failed");
        }

        var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<UserInfoResponse>(cancellationToken: cancellationToken);
        if (userInfo is null || string.IsNullOrWhiteSpace(userInfo.Id) || string.IsNullOrWhiteSpace(userInfo.Email))
        {
            throw new UnauthorizedException("Facebook profile data is invalid");
        }

        var username = userInfo.Name;
        if (string.IsNullOrWhiteSpace(username))
        {
            username = userInfo.Email.Split('@')[0];
        }

        return new ExternalAuthUserProfile(
            ExternalAuthProvider.Facebook,
            userInfo.Id,
            userInfo.Email,
            username,
            userInfo.Picture?.Data?.Url);
    }

    private static string BuildUrl(string baseUrl, IReadOnlyDictionary<string, string> query)
    {
        var serialized = string.Join("&", query.Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value)}"));
        return baseUrl.Contains('?') ? $"{baseUrl}&{serialized}" : $"{baseUrl}?{serialized}";
    }

    private sealed class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;
    }

    private sealed class UserInfoResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("picture")]
        public PictureData? Picture { get; set; }
    }

    private sealed class PictureData
    {
        [JsonPropertyName("data")]
        public PictureValue? Data { get; set; }
    }

    private sealed class PictureValue
    {
        [JsonPropertyName("url")]
        public string? Url { get; set; }
    }
}
