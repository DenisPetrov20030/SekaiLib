namespace SekaiLib.Application.DTOs.Teams;

public record SubscribedTeamChapterDto(
    Guid ChapterId,
    int ChapterNumber,
    string ChapterName,
    DateTime PublishedAt,
    bool IsPremium,
    Guid TitleId,
    string TitleName,
    string? TitleCoverImageUrl,
    Guid TeamId,
    string TeamName
);
