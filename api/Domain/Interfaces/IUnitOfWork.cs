using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Domain.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    ITitleRepository Titles { get; }
    IChapterRepository Chapters { get; }
    ITitleCommentRepository TitleComments { get; }
    IReadingListRepository ReadingLists { get; }
    IReviewRepository Reviews { get; }
    ITitleRatingRepository TitleRatings { get; }
    IRepository<Genre> Genres { get; }
    IRepository<TitleGenre> TitleGenres { get; }
    IRepository<TranslationTeam> TranslationTeams { get; }
    IRepository<TranslationTeamMember> TranslationTeamMembers { get; }
    IRepository<TranslationTeamSubscription> TranslationTeamSubscriptions { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    IRepository<UserExternalLogin> UserExternalLogins { get; }
    IUserListRepository UserLists { get; }
    IRepository<UserReadingProgress> UserReadingProgresses { get; }
    IRepository<Conversation> Conversations { get; }
    IRepository<ConversationParticipant> ConversationParticipants { get; }
    IRepository<Message> Messages { get; }
    IRepository<Friendship> Friendships { get; }
    IRepository<FriendRequest> FriendRequests { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<ChapterView> ChapterViews { get; }
    IRepository<ReviewView> ReviewViews { get; }
    IRepository<UserBan> UserBans { get; }
    IRepository<Report> Reports { get; }
    IRepository<UserBlock> UserBlocks { get; }
    IRepository<News> News { get; }
    IRepository<FaqItem> FaqItems { get; }
    IRepository<PasswordResetToken> PasswordResetTokens { get; }
    IRepository<Collection> Collections { get; }
    IRepository<CollectionSection> CollectionSections { get; }
    IRepository<CollectionItem> CollectionItems { get; }
    IRepository<CollectionComment> CollectionComments { get; }
    IRepository<CollectionReaction> CollectionReactions { get; }
    IRepository<Payment> Payments { get; }
    IRepository<UserPurchase> UserPurchases { get; }
    IRepository<ForumCategory> ForumCategories { get; }
    IRepository<ForumThread> ForumThreads { get; }
    IRepository<ForumPost> ForumPosts { get; }
    IRepository<ForumPostReaction> ForumPostReactions { get; }
    Task<int> SaveChangesAsync();
}
