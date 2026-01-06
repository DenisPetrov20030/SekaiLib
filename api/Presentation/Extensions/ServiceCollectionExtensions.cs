using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Services;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Interfaces.Repositories;
using SekaiLib.Infrastructure.Persistence;
using SekaiLib.Infrastructure.Persistence.Repositories;

namespace SekaiLib.Presentation.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITitleService, TitleService>();
        services.AddScoped<IChapterService, ChapterService>();
        services.AddScoped<IReadingListService, ReadingListService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<ITitleRatingService, TitleRatingService>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITitleRepository, TitleRepository>();
        services.AddScoped<IChapterRepository, ChapterRepository>();
        services.AddScoped<IReadingListRepository, ReadingListRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<ITitleRatingRepository, TitleRatingRepository>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(secretKey),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}
