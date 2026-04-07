using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Domain.Interfaces;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    ITitleRepository Titles { get; }
    IChapterRepository Chapters { get; }
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
    Task<int> SaveChangesAsync();
}
