namespace SekaiLib.Application.DTOs.Reviews;

public record CreateReviewCommentRequest(string Content, Guid? ParentCommentId);
