using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;

namespace SekaiLib.Application.Interfaces;

public interface ITitleService
{
    Task<PagedResponse<TitleDto>> GetCatalogAsync(CatalogFilterDto filter, int page, int pageSize);
    Task<TitleDetailsDto> GetByIdAsync(Guid id);
    Task<IEnumerable<TitleDto>> SearchAsync(string query);
    Task<TitleDetailResponse> CreateAsync(CreateTitleRequest request);
    Task<TitleDetailResponse> UpdateAsync(Guid id, UpdateTitleRequest request);
    Task DeleteAsync(Guid id);
}
