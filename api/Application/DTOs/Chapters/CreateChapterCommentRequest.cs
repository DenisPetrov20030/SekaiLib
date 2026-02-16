namespace SekaiLib.Application.DTOs.Chapters;

public record CreateChapterCommentRequest(string Content, Guid? ParentCommentId);
