namespace SekaiLib.Application.Interfaces;

public interface IOAuthFlowService
{
    string CreateState();
    string CreateCodeVerifier();
    string CreateCodeChallenge(string codeVerifier);
}
