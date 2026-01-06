namespace SekaiLib.Application.DTOs.Chapters;

public record ChapterDto(Guid Id, int Number, string Name, DateTime PublishedAt, bool IsPremium);
