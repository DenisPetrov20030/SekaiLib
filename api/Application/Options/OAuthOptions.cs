namespace SekaiLib.Application.Options;

public class OAuthOptions
{
    public string FrontendCallbackBaseUrl { get; set; } = string.Empty;
    public int TicketTtlMinutes { get; set; } = 5;
    public OAuthProviderOptions Google { get; set; } = new();
}

public class OAuthProviderOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string AuthorizeUrl { get; set; } = string.Empty;
    public string TokenUrl { get; set; } = string.Empty;
    public string UserInfoUrl { get; set; } = string.Empty;
}
