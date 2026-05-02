using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Entities;

namespace SekaiLib.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    public DbSet<User> Users { get; set; }
    public DbSet<UserExternalLogin> UserExternalLogins { get; set; }
    public DbSet<UserList> UserLists { get; set; }
    public DbSet<Title> Titles { get; set; }
    public DbSet<Chapter> Chapters { get; set; }
    public DbSet<Genre> Genres { get; set; }
    public DbSet<TranslationTeam> TranslationTeams { get; set; }
    public DbSet<TranslationTeamMember> TranslationTeamMembers { get; set; }
    public DbSet<TranslationTeamSubscription> TranslationTeamSubscriptions { get; set; }
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
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<FriendRequest> FriendRequests { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ChapterView> ChapterViews { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

    modelBuilder.Entity<UserExternalLogin>(entity =>
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Provider)
            .HasMaxLength(50)
            .IsRequired();

        entity.Property(x => x.ProviderUserId)
            .HasMaxLength(200)
            .IsRequired();

        entity.HasIndex(x => new { x.Provider, x.ProviderUserId })
            .IsUnique();

        entity.HasIndex(x => new { x.UserId, x.Provider })
            .IsUnique();
    });

    modelBuilder.Entity<UserList>(entity =>
    {
        entity.HasMany(ul => ul.ReadingListItems)
            .WithOne(rl => rl.UserList)
            .HasForeignKey(rl => rl.UserListId)
            .OnDelete(DeleteBehavior.SetNull); 
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

    modelBuilder.Entity<Conversation>(entity =>
    {
        entity.HasMany(c => c.Participants)
            .WithOne(p => p.Conversation)
            .HasForeignKey(p => p.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<ConversationParticipant>(entity =>
    {
        entity.HasIndex(p => new { p.ConversationId, p.UserId }).IsUnique();

        entity.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Message>(entity =>
    {
        entity.HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<TranslationTeam>(entity =>
    {
        entity.HasOne(t => t.Owner)
            .WithMany()
            .HasForeignKey(t => t.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    });

    modelBuilder.Entity<TranslationTeamMember>(entity =>
    {
        entity.HasKey(m => new { m.TeamId, m.UserId });

        entity.HasOne(m => m.Team)
            .WithMany(t => t.Members)
            .HasForeignKey(m => m.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<TranslationTeamSubscription>(entity =>
    {
        entity.HasKey(s => new { s.TeamId, s.UserId });

        entity.HasOne(s => s.Team)
            .WithMany(t => t.Subscriptions)
            .HasForeignKey(s => s.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Chapter>(entity =>
    {
        entity.HasOne(c => c.TranslationTeam)
            .WithMany(t => t.Chapters)
            .HasForeignKey(c => c.TranslationTeamId)
            .OnDelete(DeleteBehavior.SetNull);
    });

    modelBuilder.Entity<ChapterView>(entity =>
    {
        entity.HasOne(v => v.Chapter)
            .WithMany()
            .HasForeignKey(v => v.ChapterId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(v => new { v.ChapterId, v.UserId });

        entity.HasIndex(v => new { v.ChapterId, v.IpHash });
    });
}


}
