using System.Security.Cryptography;
using System.Text;
using SekaiLib.Application.Interfaces;

namespace SekaiLib.Application.Services;

public class OAuthFlowService : IOAuthFlowService
{
    public string CreateState()
    {
        return CreateUrlSafeToken(32);
    }

    public string CreateCodeVerifier()
    {
        return CreateUrlSafeToken(64);
    }

    public string CreateCodeChallenge(string codeVerifier)
    {
        var bytes = Encoding.ASCII.GetBytes(codeVerifier);
        var hash = SHA256.HashData(bytes);
        return Base64UrlEncode(hash);
    }

    private static string CreateUrlSafeToken(int bytesLength)
    {
        var bytes = RandomNumberGenerator.GetBytes(bytesLength);
        return Base64UrlEncode(bytes);
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
