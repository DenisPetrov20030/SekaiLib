using SekaiLib.Domain.Enums;

namespace SekaiLib.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<ReadingList> ReadingLists { get; set; } = new List<ReadingList>();
    public ICollection<ReadingProgress> ReadingProgresses { get; set; } = new List<ReadingProgress>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<ReviewReaction> ReviewReactions { get; set; } = new List<ReviewReaction>();
    public ICollection<TitleRating> TitleRatings { get; set; } = new List<TitleRating>();
}
