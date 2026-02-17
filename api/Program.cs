using Microsoft.EntityFrameworkCore;
using SekaiLib.Presentation.Extensions;
using SekaiLib.Infrastructure.Persistence;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    // Map IFormFile to file upload schema to avoid Swagger generation errors
    c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
});

// Real-time messaging
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5174", "https://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddJwtAuthentication(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var pendingMigrations = context.Database.GetPendingMigrations();
        // If there are migrations, apply them; otherwise ensure schema is created
        if (pendingMigrations.Any())
        {
            context.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully.");
        }
        else
        {
            logger.LogInformation("No migrations found; ensuring database is created.");
            context.Database.EnsureCreated();
        }
    }
    catch (Exception ex)
    {
        var loggerFactory = services.GetRequiredService<ILoggerFactory>();
        var log = loggerFactory.CreateLogger("DatabaseInit");
        log.LogWarning(ex, "Failed to apply migrations, attempting to create database schema with EnsureCreated().");
        try
        {
            var context = services.GetRequiredService<AppDbContext>();
            context.Database.EnsureCreated();
            log.LogInformation("Database created with EnsureCreated().");
        }
        catch (Exception innerEx)
        {
            log.LogError(innerEx, "Failed to create database.");
            throw;
        }
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseGlobalExceptionHandler();

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

// Serve static files (for uploaded avatars, covers, etc.)
app.UseStaticFiles();

var uploadsRoot = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
    "SekaiLib",
    "uploads");
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads"
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SignalR hubs
app.MapHub<SekaiLib.Presentation.Hubs.ChatHub>("/hubs/chat");

app.Run();
