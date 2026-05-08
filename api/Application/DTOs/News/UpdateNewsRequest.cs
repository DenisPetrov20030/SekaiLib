namespace SekaiLib.Application.DTOs.News;

public record UpdateNewsRequest(string Title, string Content, bool IsPublished);
