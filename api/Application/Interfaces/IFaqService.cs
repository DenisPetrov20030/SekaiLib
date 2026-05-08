using SekaiLib.Application.DTOs.Faq;

namespace SekaiLib.Application.Interfaces;

public interface IFaqService
{
    Task<IEnumerable<FaqItemDto>> GetPublishedAsync();
    Task<IEnumerable<FaqItemDto>> GetAllAsync();
    Task<FaqItemDto> CreateAsync(CreateFaqItemRequest request);
    Task<FaqItemDto> UpdateAsync(Guid id, UpdateFaqItemRequest request);
    Task DeleteAsync(Guid id);
}
