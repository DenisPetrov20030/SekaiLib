namespace SekaiLib.Application.DTOs.News;

public record CreateNewsRequest(string Title, string Content, bool IsPublished);
