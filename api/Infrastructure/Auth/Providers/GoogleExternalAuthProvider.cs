using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using SekaiLib.Application.DTOs.Auth;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Options;

namespace SekaiLib.Infrastructure.Auth.Providers;

public class GoogleExternalAuthProvider : IExternalAuthProvider
{
    private readonly HttpClient _httpClient;
    private readonly OAuthOptions _options;

    public GoogleExternalAuthProvider(HttpClient httpClient, IOptions<OAuthOptions> options)
    {
        _httpClient = httpClient;
        _options = options.Value;
    }

    public ExternalAuthProvider Provider => ExternalAuthProvider.Google;

    public Task<string> BuildAuthorizationUrlAsync(string state, string codeChallenge, string redirectUri, CancellationToken cancellationToken)
    {
        var query = new Dictionary<string, string>
        {
            ["client_id"] = _options.Google.ClientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = "openid email profile",
            ["state"] = state,
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = "S256",
            ["access_type"] = "offline",
            ["prompt"] = "consent"
        };

        return Task.FromResult(BuildUrl(_options.Google.AuthorizeUrl, query));
    }

    public async Task<ExternalAuthUserProfile> GetUserProfileAsync(string code, string codeVerifier, string redirectUri, CancellationToken cancellationToken)
    {
        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = _options.Google.ClientId,
            ["client_secret"] = _options.Google.ClientSecret,
            ["code"] = code,
            ["code_verifier"] = codeVerifier,
            ["grant_type"] = "authorization_code",
            ["redirect_uri"] = redirectUri
        });

        var tokenResponse = await _httpClient.PostAsync(_options.Google.TokenUrl, content, cancellationToken);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            throw new UnauthorizedException("Google authentication failed");
        }

        var token = await tokenResponse.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken: cancellationToken);
        if (token is null || string.IsNullOrWhiteSpace(token.AccessToken))
        {
            throw new UnauthorizedException("Google authentication failed");
        }

        using var userInfoRequest = new HttpRequestMessage(HttpMethod.Get, _options.Google.UserInfoUrl);
        userInfoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.AccessToken);

        var userInfoResponse = await _httpClient.SendAsync(userInfoRequest, cancellationToken);
        if (!userInfoResponse.IsSuccessStatusCode)
        {
            throw new UnauthorizedException("Google profile request failed");
        }

        var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<UserInfoResponse>(cancellationToken: cancellationToken);
        if (userInfo is null || string.IsNullOrWhiteSpace(userInfo.Sub) || string.IsNullOrWhiteSpace(userInfo.Email))
        {
            throw new UnauthorizedException("Google profile data is invalid");
        }

        var username = userInfo.Name;
        if (string.IsNullOrWhiteSpace(username))
        {
            username = userInfo.Email.Split('@')[0];
        }

        return new ExternalAuthUserProfile(
            ExternalAuthProvider.Google,
            userInfo.Sub,
            userInfo.Email,
            username,
            userInfo.Picture);
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
        [JsonPropertyName("sub")]
        public string Sub { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }
    }
}
