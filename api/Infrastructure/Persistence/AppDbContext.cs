using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    public DbSet<User> Users { get; set; }
    public DbSet<UserList> UserLists { get; set; }
    public DbSet<Title> Titles { get; set; }
    public DbSet<Chapter> Chapters { get; set; }
    public DbSet<Genre> Genres { get; set; }
    public DbSet<TranslationTeam> TranslationTeams { get; set; }
    public DbSet<ReadingList> ReadingLists { get; set; }
    public DbSet<ReadingProgress> ReadingProgresses { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<TitleGenre> TitleGenres { get; set; }
    public DbSet<TitleTranslator> TitleTranslators { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<ReviewReaction> ReviewReactions { get; set; }
    public DbSet<TitleRating> TitleRatings { get; set; }
    public DbSet<UserReadingProgress> UserReadingProgresses { get; set; }

   protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

    // Нова конфігурація для кастомних списків
    modelBuilder.Entity<UserList>(entity =>
    {
        entity.HasMany(ul => ul.ReadingListItems)
            .WithOne(rl => rl.UserList)
            .HasForeignKey(rl => rl.UserListId)
            .OnDelete(DeleteBehavior.SetNull); // Якщо список видалять, тайтл лишиться в бібліотеці, але без прив'язки до папки
    });
}
    
}
