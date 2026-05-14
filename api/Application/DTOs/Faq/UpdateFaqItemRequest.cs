namespace SekaiLib.Application.DTOs.Faq;

public record UpdateFaqItemRequest(string Question, string Answer, string CategoryId, int Order, bool IsPublished);
