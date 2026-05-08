namespace SekaiLib.Application.DTOs.Titles;

public record CreateTitleCommentRequest(string Content, Guid? ParentCommentId);
