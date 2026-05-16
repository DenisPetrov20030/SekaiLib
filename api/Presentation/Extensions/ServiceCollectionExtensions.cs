using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Options;
using SekaiLib.Application.Services;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Interfaces.Repositories;
using SekaiLib.Infrastructure.Auth;
using SekaiLib.Infrastructure.Auth.Providers;
using SekaiLib.Infrastructure.Caching;
using SekaiLib.Infrastructure.Payments;
using SekaiLib.Infrastructure.Persistence;
using SekaiLib.Infrastructure.Persistence.Repositories;

namespace SekaiLib.Presentation.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IExternalAuthService, ExternalAuthService>();
        services.AddScoped<ITitleService, TitleService>();
        services.AddScoped<IChapterService, ChapterService>();
        services.AddScoped<IReadingListService, ReadingListService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<ITitleCommentService, TitleCommentService>();
        services.AddScoped<ITitleRatingService, TitleRatingService>();
        services.AddScoped<UserListService>();
        services.AddScoped<IMessagingService, MessagingService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ITranslationTeamService, TranslationTeamService>();
        services.AddScoped<IOAuthFlowService, OAuthFlowService>();
        services.AddScoped<IOAuthStateStore, OAuthStateStore>();
        services.AddScoped<IExternalAuthTicketStore, ExternalAuthTicketStore>();
        services.AddScoped<IUserBanService, UserBanService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IUserBlockService, UserBlockService>();
        services.AddScoped<INewsService, NewsService>();
        services.AddScoped<IFaqService, FaqService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<IAccountLinkService, AccountLinkService>();
        services.AddScoped<ICollectionService, CollectionService>();
        services.AddScoped<ICollectionCommentService, CollectionCommentService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IForumService, ForumService>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.Configure<OAuthOptions>(configuration.GetSection("OAuth"));
        services.Configure<LiqPayOptions>(configuration.GetSection("LiqPay"));
        services.AddScoped<ILiqPayService, LiqPayService>();
        services.AddMemoryCache(); // keep — still used by OAuthStateStore
        services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = configuration.GetConnectionString("Redis") ?? "redis:6379";
        });
        services.AddSingleton<IViewTrackingService, DistributedCacheViewTrackingService>();
        services.AddSingleton<IReadCacheService, DistributedReadCacheService>();
        services.AddHttpClient<GoogleExternalAuthProvider>();
        services.AddScoped<IExternalAuthProvider>(sp => sp.GetRequiredService<GoogleExternalAuthProvider>());

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITitleRepository, TitleRepository>();
        services.AddScoped<IChapterRepository, ChapterRepository>();
        services.AddScoped<ITitleCommentRepository, TitleCommentRepository>();
        services.AddScoped<IReadingListRepository, ReadingListRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<ITitleRatingRepository, TitleRatingRepository>();
        services.AddScoped<IUserListRepository, UserListRepository>();
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
