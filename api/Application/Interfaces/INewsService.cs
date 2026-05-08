using SekaiLib.Application.DTOs.News;
using SekaiLib.Application.Common;

namespace SekaiLib.Application.Interfaces;

public interface INewsService
{
    Task<PagedResult<NewsDto>> GetPublishedAsync(int page, int pageSize);
    Task<PagedResult<NewsDto>> GetAllAsync(int page, int pageSize);
    Task<NewsDto?> GetByIdAsync(Guid id);
    Task<NewsDto> CreateAsync(Guid authorId, CreateNewsRequest request);
    Task<NewsDto> UpdateAsync(Guid authorId, Guid id, UpdateNewsRequest request);
    Task DeleteAsync(Guid id);
}
