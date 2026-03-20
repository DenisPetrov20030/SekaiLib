using Microsoft.EntityFrameworkCore;
using SekaiLib.Presentation.Extensions;
using SekaiLib.Infrastructure.Persistence;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
ApplyDotEnv(builder.Configuration, Directory.GetCurrentDirectory());

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
});

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

        EnsureUserExternalLoginsTable(context, logger);
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
            EnsureUserExternalLoginsTable(context, log);
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

app.MapHub<SekaiLib.Presentation.Hubs.ChatHub>("/hubs/chat");
app.MapHub<SekaiLib.Presentation.Hubs.NotificationsHub>("/hubs/notifications");

app.Run();

static void EnsureUserExternalLoginsTable(AppDbContext context, ILogger logger)
{
    const string sql = """
        CREATE TABLE IF NOT EXISTS "UserExternalLogins" (
            "Id" uuid NOT NULL,
            "UserId" uuid NOT NULL,
            "Provider" character varying(50) NOT NULL,
            "ProviderUserId" character varying(200) NOT NULL,
            "CreatedAt" timestamp with time zone NOT NULL,
            CONSTRAINT "PK_UserExternalLogins" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_UserExternalLogins_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserExternalLogins_Provider_ProviderUserId"
            ON "UserExternalLogins" ("Provider", "ProviderUserId");

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserExternalLogins_UserId_Provider"
            ON "UserExternalLogins" ("UserId", "Provider");
        """;

    context.Database.ExecuteSqlRaw(sql);
    logger.LogInformation("Ensured UserExternalLogins table exists.");
}

static void ApplyDotEnv(ConfigurationManager configuration, string currentDirectory)
{
    var candidates = new[]
    {
        Path.Combine(currentDirectory, ".env"),
        Path.Combine(currentDirectory, "api", ".env")
    };

    foreach (var path in candidates)
    {
        if (!File.Exists(path))
        {
            continue;
        }

        var values = ParseDotEnv(path);
        if (values.Count > 0)
        {
            configuration.AddInMemoryCollection(values);
        }
    }
}

static Dictionary<string, string?> ParseDotEnv(string filePath)
{
    var result = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
    foreach (var rawLine in File.ReadLines(filePath))
    {
        var line = rawLine.Trim();
        if (line.Length == 0 || line.StartsWith('#'))
        {
            continue;
        }

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
        {
            continue;
        }

        var key = line[..separatorIndex].Trim().Replace("__", ":");
        var value = line[(separatorIndex + 1)..].Trim();

        if ((value.StartsWith('"') && value.EndsWith('"')) || (value.StartsWith('\'') && value.EndsWith('\'')))
        {
            value = value[1..^1];
        }

        result[key] = value;
    }

    return result;
}
