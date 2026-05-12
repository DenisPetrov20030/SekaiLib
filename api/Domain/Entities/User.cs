using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public Gender Gender { get; set; } = Gender.NotSpecified;
    public string? AboutMe { get; set; }
    public string? PasswordHash { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Настройки уведомлений
    public string NotifyListStatuses { get; set; } = "0"; // JSON array of reading statuses: [0,1,2,3,4]
    public string NotifyUserListIds { get; set; } = "[]"; // JSON array of user list IDs
    // Дополнительные булевы флаги для загальних сповіщень
    public bool NotifyTitleCompleted { get; set; } = false;
    public bool NotifyFriendRequests { get; set; } = false;
    
    // Налаштування приватності профілю (0=Public, 1=FriendsOnly, 2=ExceptIgnoreList, 3=Private)
    public int? ProfileVisibility { get; set; } = 0;

    // Заблоковані жанри (JSON array of genre IDs)
    public string BlockedGenres { get; set; } = "[]";
    
    public ICollection<UserExternalLogin> ExternalLogins { get; set; } = new List<UserExternalLogin>();
    public ICollection<UserList> CustomLists { get; set; } = new List<UserList>();
    public ICollection<ReadingList> ReadingLists { get; set; } = new List<ReadingList>();
    public ICollection<ReadingProgress> ReadingProgresses { get; set; } = new List<ReadingProgress>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<ReviewReaction> ReviewReactions { get; set; } = new List<ReviewReaction>();
    public ICollection<TitleRating> TitleRatings { get; set; } = new List<TitleRating>();
    public ICollection<Title> PublishedTitles { get; set; } = new List<Title>();
}
