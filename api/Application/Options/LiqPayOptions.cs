namespace SekaiLib.Application.Options;

public class LiqPayOptions
{
    public string PublicKey { get; set; } = string.Empty;
    public string PrivateKey { get; set; } = string.Empty;
    public bool IsSandbox { get; set; } = true;
    public string ServerCallbackUrl { get; set; } = string.Empty;
    public string FrontendResultUrl { get; set; } = string.Empty;
}
