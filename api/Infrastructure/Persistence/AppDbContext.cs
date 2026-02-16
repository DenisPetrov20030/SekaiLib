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
    public DbSet<ReviewComment> ReviewComments { get; set; }
    public DbSet<ReviewCommentReaction> ReviewCommentReactions { get; set; }
    public DbSet<ChapterComment> ChapterComments { get; set; }
    public DbSet<ChapterCommentReaction> ChapterCommentReactions { get; set; }
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
    modelBuilder.Entity<ReviewComment>(entity =>
    {
        entity.HasOne(rc => rc.Review)
            .WithMany(r => r.Comments)
            .HasForeignKey(rc => rc.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(rc => rc.User)
            .WithMany()
            .HasForeignKey(rc => rc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Self-referencing relation for nested replies
        entity.HasOne(rc => rc.ParentComment)
            .WithMany(p => p.Replies)
            .HasForeignKey(rc => rc.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<ReviewCommentReaction>(entity =>
    {
        entity.HasOne(rcr => rcr.Comment)
            .WithMany(c => c.Reactions)
            .HasForeignKey(rcr => rcr.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(rcr => rcr.User)
            .WithMany()
            .HasForeignKey(rcr => rcr.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    // Chapter comments configuration
    modelBuilder.Entity<ChapterComment>(entity =>
    {
        entity.HasOne(cc => cc.Chapter)
            .WithMany()
            .HasForeignKey(cc => cc.ChapterId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(cc => cc.User)
            .WithMany()
            .HasForeignKey(cc => cc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(cc => cc.ParentComment)
            .WithMany(p => p.Replies)
            .HasForeignKey(cc => cc.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<ChapterCommentReaction>(entity =>
    {
        entity.HasOne(r => r.Comment)
            .WithMany(c => c.Reactions)
            .HasForeignKey(r => r.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });
}
    
}
