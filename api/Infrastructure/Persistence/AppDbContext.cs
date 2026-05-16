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
    public DbSet<ReviewView> ReviewViews { get; set; }
    public DbSet<ChapterComment> ChapterComments { get; set; }
    public DbSet<ChapterCommentReaction> ChapterCommentReactions { get; set; }
    public DbSet<TitleComment> TitleComments { get; set; }
    public DbSet<TitleCommentReaction> TitleCommentReactions { get; set; }
    public DbSet<TitleRating> TitleRatings { get; set; }
    public DbSet<UserReadingProgress> UserReadingProgresses { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<FriendRequest> FriendRequests { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ChapterView> ChapterViews { get; set; }
    public DbSet<UserBan> UserBans { get; set; }
    public DbSet<Report> Reports { get; set; }
    public DbSet<UserBlock> UserBlocks { get; set; }
    public DbSet<News> News { get; set; }
    public DbSet<FaqItem> FaqItems { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }
    public DbSet<Collection> Collections { get; set; }
    public DbSet<CollectionSection> CollectionSections { get; set; }
    public DbSet<CollectionItem> CollectionItems { get; set; }
    public DbSet<CollectionComment> CollectionComments { get; set; }
    public DbSet<CollectionReaction> CollectionReactions { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<UserPurchase> UserPurchases { get; set; }
    public DbSet<ForumCategory> ForumCategories { get; set; }
    public DbSet<ForumThread> ForumThreads { get; set; }
    public DbSet<ForumPost> ForumPosts { get; set; }
    public DbSet<ForumPostReaction> ForumPostReactions { get; set; }

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

    modelBuilder.Entity<TitleComment>(entity =>
    {
        entity.HasOne(tc => tc.Title)
            .WithMany()
            .HasForeignKey(tc => tc.TitleId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(tc => tc.User)
            .WithMany()
            .HasForeignKey(tc => tc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(tc => tc.ParentComment)
            .WithMany(p => p.Replies)
            .HasForeignKey(tc => tc.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<TitleCommentReaction>(entity =>
    {
        entity.HasOne(tcr => tcr.Comment)
            .WithMany(c => c.Reactions)
            .HasForeignKey(tcr => tcr.CommentId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(tcr => tcr.User)
            .WithMany()
            .HasForeignKey(tcr => tcr.UserId)
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

    modelBuilder.Entity<UserBan>(entity =>
    {
        entity.HasOne(b => b.User)
            .WithMany()
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(b => b.BannedByUser)
            .WithMany()
            .HasForeignKey(b => b.BannedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    });

    modelBuilder.Entity<Report>(entity =>
    {
        entity.HasOne(r => r.Reporter)
            .WithMany()
            .HasForeignKey(r => r.ReporterId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(r => r.ReviewedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReviewedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    });

    modelBuilder.Entity<UserBlock>(entity =>
    {
        entity.HasIndex(b => new { b.BlockerId, b.BlockedUserId }).IsUnique();

        entity.HasOne(b => b.Blocker)
            .WithMany()
            .HasForeignKey(b => b.BlockerId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(b => b.BlockedUser)
            .WithMany()
            .HasForeignKey(b => b.BlockedUserId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<News>(entity =>
    {
        entity.HasOne(n => n.Author)
            .WithMany()
            .HasForeignKey(n => n.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);
    });

    modelBuilder.Entity<PasswordResetToken>(entity =>
    {
        entity.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(t => t.Token).IsUnique();
    });

    modelBuilder.Entity<Collection>(entity =>
    {
        entity.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<CollectionSection>(entity =>
    {
        entity.HasOne(s => s.Collection)
            .WithMany(c => c.Sections)
            .HasForeignKey(s => s.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<CollectionItem>(entity =>
    {
        entity.HasOne(i => i.Collection)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(i => i.Section)
            .WithMany(s => s.Items)
            .HasForeignKey(i => i.SectionId)
            .OnDelete(DeleteBehavior.SetNull);

        entity.HasOne(i => i.Title)
            .WithMany()
            .HasForeignKey(i => i.TitleId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<CollectionComment>(entity =>
    {
        entity.HasOne(c => c.Collection)
            .WithMany(col => col.Comments)
            .HasForeignKey(c => c.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(c => c.Author)
            .WithMany()
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(c => c.ParentComment)
            .WithMany(p => p.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<CollectionReaction>(entity =>
    {
        entity.HasKey(r => new { r.CollectionId, r.UserId });

        entity.HasOne(r => r.Collection)
            .WithMany(c => c.Reactions)
            .HasForeignKey(r => r.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<Payment>(entity =>
    {
        entity.HasIndex(p => p.OrderId).IsUnique();

        entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");

        entity.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(p => p.Chapter)
            .WithMany()
            .HasForeignKey(p => p.ChapterId)
            .OnDelete(DeleteBehavior.SetNull);
    });

    modelBuilder.Entity<UserPurchase>(entity =>
    {
        entity.HasIndex(p => new { p.UserId, p.ChapterId }).IsUnique();

        entity.HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(p => p.Chapter)
            .WithMany()
            .HasForeignKey(p => p.ChapterId)
            .OnDelete(DeleteBehavior.SetNull);

        entity.HasOne(p => p.Payment)
            .WithMany()
            .HasForeignKey(p => p.PaymentId)
            .OnDelete(DeleteBehavior.Cascade);
    });

    modelBuilder.Entity<ForumThread>(entity =>
    {
        entity.HasOne(t => t.Category)
            .WithMany(c => c.Threads)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(t => t.Author)
            .WithMany()
            .HasForeignKey(t => t.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(t => t.LastPostUser)
            .WithMany()
            .HasForeignKey(t => t.LastPostUserId)
            .OnDelete(DeleteBehavior.SetNull);
    });

    modelBuilder.Entity<ForumPost>(entity =>
    {
        entity.HasOne(p => p.Thread)
            .WithMany(t => t.Posts)
            .HasForeignKey(p => p.ThreadId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(p => p.Author)
            .WithMany()
            .HasForeignKey(p => p.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(p => p.QuotedPost)
            .WithMany()
            .HasForeignKey(p => p.QuotedPostId)
            .OnDelete(DeleteBehavior.SetNull);
    });

    modelBuilder.Entity<ForumPostReaction>(entity =>
    {
        entity.HasKey(r => new { r.PostId, r.UserId });

        entity.HasOne(r => r.Post)
            .WithMany(p => p.Reactions)
            .HasForeignKey(r => r.PostId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });
}


}
