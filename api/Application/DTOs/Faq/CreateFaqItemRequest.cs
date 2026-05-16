namespace SekaiLib.Application.DTOs.Faq;

public record CreateFaqItemRequest(string Question, string Answer, int Order, bool IsPublished);
