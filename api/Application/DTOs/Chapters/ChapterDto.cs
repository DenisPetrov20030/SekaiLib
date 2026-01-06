namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterDto(Guid Id, int ChapterNumber, string Name, DateTime PublishedAt, bool IsPremium);
