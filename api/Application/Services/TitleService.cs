using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Common;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace SekaiLib.Application.Services;

public class TitleService : ITitleService
{
    private readonly IUnitOfWork _unitOfWork;

    public TitleService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResponse<TitleDto>> GetCatalogAsync(CatalogFilterDto filter, int page, int pageSize)
    {
        var catalogFilter = new CatalogFilter
        {
            Search = filter.Search,
            GenreId = filter.GenreId,
            Country = filter.Country,
            Status = filter.Status
        };

        var result = await _unitOfWork.Titles.GetCatalogAsync(catalogFilter, page, pageSize);

        var titleDtos = result.Data.Select(t => new TitleDto(
            t.Id,
            t.Name,
            t.Author,
            t.Description,
            t.CoverImageUrl,
            t.Status,
            t.Chapters.Count
        ));

        return new PagedResponse<TitleDto>(
            titleDtos,
            result.TotalCount,
            result.Page,
            result.PageSize,
            result.TotalPages
        );
    }

    public async Task<TitleDetailsDto> GetByIdAsync(Guid id)
    {
        var title = await _unitOfWork.Titles.GetWithChaptersAsync(id);
        if (title == null)
            throw new NotFoundException("Title", id);

        var genres = title.TitleGenres.Select(tg => new GenreDto(tg.Genre.Id, tg.Genre.Name));
        var translationTeams = title.TitleTranslators.Select(tt => new TranslationTeamDto(tt.TranslationTeam.Id, tt.TranslationTeam.Name));
        var chapters = title.Chapters
            .OrderBy(c => c.Number)
            .Select(c => new ChapterDto(c.Id, c.Number, c.Name, c.PublishedAt, c.IsPremium));

        return new TitleDetailsDto(
            title.Id,
            title.Name,
            title.Author,
            title.Description,
            title.CoverImageUrl,
            title.Status,
            title.CountryOfOrigin,
            genres,
            translationTeams,
            chapters
        );
    }

    public async Task<IEnumerable<TitleDto>> SearchAsync(string query)
    {
        var titles = await _unitOfWork.Titles.SearchByNameAsync(query);

        return titles.Select(t => new TitleDto(
            t.Id,
            t.Name,
            t.Author,
            t.Description,
            t.CoverImageUrl,
            t.Status,
            t.Chapters.Count
        ));
    }

    public async Task<TitleDetailResponse> CreateAsync(CreateTitleRequest request)
    {
        var title = new Title
        {
            Id = Guid.NewGuid(),
            Name = request.Title,
            Description = request.Description ?? string.Empty,
            CoverImageUrl = request.CoverUrl ?? string.Empty,
            Status = request.Status,
            Author = string.Empty,
            CountryOfOrigin = string.Empty,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var genreId in request.GenreIds)
        {
            title.TitleGenres.Add(new TitleGenre
            {
                TitleId = title.Id,
                GenreId = genreId
            });
        }

        await _unitOfWork.Titles.AddAsync(title);
        await _unitOfWork.SaveChangesAsync();

        return await GetDetailResponseAsync(title.Id);
    }

    public async Task<TitleDetailResponse> UpdateAsync(Guid id, UpdateTitleRequest request)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(id);
        if (title == null)
            throw new NotFoundException("Title", id);

        title.Name = request.Title;
        title.Description = request.Description ?? string.Empty;
        title.CoverImageUrl = request.CoverUrl ?? string.Empty;
        title.Status = request.Status;
        title.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Titles.UpdateAsync(title);
        await _unitOfWork.SaveChangesAsync();

        return await GetDetailResponseAsync(title.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(id);
        if (title == null)
            throw new NotFoundException("Title", id);

        await _unitOfWork.Titles.DeleteAsync(title);
        await _unitOfWork.SaveChangesAsync();
    }

    private async Task<TitleDetailResponse> GetDetailResponseAsync(Guid id)
    {
        var title = await _unitOfWork.Titles.GetWithChaptersAsync(id);
        if (title == null)
            throw new NotFoundException("Title", id);

        var likesCount = await _unitOfWork.TitleRatings.GetLikesCountAsync(id);
        var dislikesCount = await _unitOfWork.TitleRatings.GetDislikesCountAsync(id);

        var genres = title.TitleGenres.Select(tg => new GenreDto(tg.Genre.Id, tg.Genre.Name)).ToList();

        return new TitleDetailResponse(
            title.Id,
            title.Name,
            null,
            title.Description,
            title.CoverImageUrl,
            title.Status,
            null,
            genres,
            title.Chapters.Count,
            likesCount,
            dislikesCount,
            title.CreatedAt,
            title.UpdatedAt
        );
    }
}
