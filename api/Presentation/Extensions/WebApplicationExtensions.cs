using SekaiLib.Presentation.Middleware;

namespace SekaiLib.Presentation.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication UseGlobalExceptionHandler(this WebApplication app)
    {
        app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
        return app;
    }
}
