using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;

namespace SekaiLib.Application.Interfaces;

public interface ITitleService
{
    Task<PagedResponse<TitleDto>> GetCatalogAsync(CatalogFilterDto filter, int page, int pageSize);
    Task<TitleDetailsDto> GetByIdAsync(Guid id);
    Task<IEnumerable<TitleDto>> SearchAsync(string query);
    Task<TitleDetailsDto> CreateAsync(Guid userId, CreateTitleRequest request);
    Task<TitleDetailsDto> UpdateAsync(Guid userId, Guid titleId, UpdateTitleRequest request);
    Task DeleteAsync(Guid userId, Guid titleId);
    Task<PagedResponse<TitleDto>> GetUserTitlesAsync(Guid userId, int page, int pageSize);
}
