namespace SekaiLib.Application.DTOs.Faq;

public record CreateFaqItemRequest(string Question, string Answer, string CategoryId, int Order, bool IsPublished);
