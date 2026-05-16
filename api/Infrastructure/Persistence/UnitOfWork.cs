using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Interfaces.Repositories;
using SekaiLib.Infrastructure.Persistence.Repositories;

namespace SekaiLib.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;

    public IUserRepository Users { get; }
    public ITitleRepository Titles { get; }
    public IChapterRepository Chapters { get; }
    public ITitleCommentRepository TitleComments { get; }
    public IReadingListRepository ReadingLists { get; }
    public IReviewRepository Reviews { get; }
    public ITitleRatingRepository TitleRatings { get; }
    public IRepository<Genre> Genres { get; }
    public IRepository<TitleGenre> TitleGenres { get; }
    public IRepository<TranslationTeam> TranslationTeams { get; }
    public IRepository<TranslationTeamMember> TranslationTeamMembers { get; }
    public IRepository<TranslationTeamSubscription> TranslationTeamSubscriptions { get; }
    public IRepository<RefreshToken> RefreshTokens { get; }
    public IRepository<UserExternalLogin> UserExternalLogins { get; }
    public IUserListRepository UserLists { get; }
    private IRepository<Collection>? _collections;
    private IRepository<CollectionSection>? _collectionSections;
    private IRepository<CollectionItem>? _collectionItems;
    private IRepository<CollectionReaction>? _collectionReactions;
    private IRepository<CollectionComment>? _collectionComments;
    private IRepository<Conversation>? _conversations;
    private IRepository<ConversationParticipant>? _conversationParticipants;
    private IRepository<Message>? _messages;
    private IRepository<Friendship>? _friendships;
    private IRepository<FriendRequest>? _friendRequests;
    private IRepository<Notification>? _notifications;

    public UnitOfWork(
        AppDbContext context,
        IUserRepository users,
        ITitleRepository titles,
        IChapterRepository chapters,
        ITitleCommentRepository titleComments,
        IReadingListRepository readingLists,
        IReviewRepository reviews,
        ITitleRatingRepository titleRatings,
        IRepository<Genre> genres,
        IRepository<TitleGenre> titleGenres,
        IRepository<TranslationTeam> translationTeams,
        IRepository<RefreshToken> refreshTokens,
        IUserListRepository userLists)
    {
        _context = context;
        Users = users;
        Titles = titles;
        Chapters = chapters;
        TitleComments = titleComments;
        ReadingLists = readingLists;
        Reviews = reviews;
        TitleRatings = titleRatings;
        Genres = genres;
        TitleGenres = titleGenres;
        TranslationTeams = translationTeams;
        TranslationTeamMembers = new Repository<TranslationTeamMember>(_context);
        TranslationTeamSubscriptions = new Repository<TranslationTeamSubscription>(_context);
        RefreshTokens = refreshTokens;
        UserExternalLogins = new Repository<UserExternalLogin>(_context);
        UserLists = userLists;
    }

    public IRepository<Collection> Collections =>
        _collections ??= new Repository<Collection>(_context);

    public IRepository<CollectionSection> CollectionSections =>
        _collectionSections ??= new Repository<CollectionSection>(_context);

    public IRepository<CollectionItem> CollectionItems =>
        _collectionItems ??= new Repository<CollectionItem>(_context);

    public IRepository<CollectionReaction> CollectionReactions =>
        _collectionReactions ??= new Repository<CollectionReaction>(_context);

    public IRepository<CollectionComment> CollectionComments =>
        _collectionComments ??= new Repository<CollectionComment>(_context);

    private IRepository<UserReadingProgress>? _userReadingProgresses;
    public IRepository<UserReadingProgress> UserReadingProgresses =>
        _userReadingProgresses ??= new Repository<UserReadingProgress>(_context);

    public IRepository<Conversation> Conversations =>
        _conversations ??= new Repository<Conversation>(_context);

    public IRepository<ConversationParticipant> ConversationParticipants =>
        _conversationParticipants ??= new Repository<ConversationParticipant>(_context);

    public IRepository<Message> Messages =>
        _messages ??= new Repository<Message>(_context);

    public IRepository<Friendship> Friendships =>
        _friendships ??= new Repository<Friendship>(_context);

    public IRepository<FriendRequest> FriendRequests =>
        _friendRequests ??= new Repository<FriendRequest>(_context);

    public IRepository<Notification> Notifications =>
        _notifications ??= new Repository<Notification>(_context);

    private IRepository<ChapterView>? _chapterViews;
    public IRepository<ChapterView> ChapterViews =>
        _chapterViews ??= new Repository<ChapterView>(_context);

    private IRepository<ReviewView>? _reviewViews;
    public IRepository<ReviewView> ReviewViews =>
        _reviewViews ??= new Repository<ReviewView>(_context);
    private IRepository<UserBan>? _userBans;
    public IRepository<UserBan> UserBans =>
        _userBans ??= new Repository<UserBan>(_context);

    private IRepository<Report>? _reports;
    public IRepository<Report> Reports =>
        _reports ??= new Repository<Report>(_context);

    private IRepository<UserBlock>? _userBlocks;
    public IRepository<UserBlock> UserBlocks =>
        _userBlocks ??= new Repository<UserBlock>(_context);

    private IRepository<News>? _news;
    public IRepository<News> News =>
        _news ??= new Repository<News>(_context);

    private IRepository<FaqItem>? _faqItems;
    public IRepository<FaqItem> FaqItems =>
        _faqItems ??= new Repository<FaqItem>(_context);

    private IRepository<PasswordResetToken>? _passwordResetTokens;
    public IRepository<PasswordResetToken> PasswordResetTokens =>
        _passwordResetTokens ??= new Repository<PasswordResetToken>(_context);

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
