namespace SekaiLib.Application.DTOs.Faq;

public record UpdateFaqItemRequest(string Question, string Answer, int Order, bool IsPublished);
