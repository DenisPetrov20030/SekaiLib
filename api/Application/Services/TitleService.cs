using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Common;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Interfaces.Repositories;
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

        var publisher = new PublisherDto(
            title.Publisher.Id,
            title.Publisher.Username,
            title.Publisher.AvatarUrl
        );

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
            publisher,
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

    public async Task<TitleDetailsDto> CreateAsync(Guid userId, CreateTitleRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new NotFoundException("User", userId);

        var title = new Title
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Author = request.Author,
            Description = request.Description,
            CoverImageUrl = request.CoverImageUrl ?? string.Empty,
            Status = request.Status,
            CountryOfOrigin = request.CountryOfOrigin,
            PublisherId = userId,
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

        return await GetByIdAsync(title.Id);
    }

    public async Task<TitleDetailsDto> UpdateAsync(Guid userId, Guid titleId, UpdateTitleRequest request)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        if (title.PublisherId != userId && user.Role != UserRole.Administrator)
            throw new ForbiddenException();

        title.Name = request.Name;
        title.Author = request.Author;
        title.Description = request.Description;
        title.CoverImageUrl = request.CoverImageUrl ?? title.CoverImageUrl;
        title.Status = request.Status;
        title.CountryOfOrigin = request.CountryOfOrigin;
        title.UpdatedAt = DateTime.UtcNow;

        var existingGenres = await _unitOfWork.TitleGenres.GetByTitleIdAsync(titleId);
        foreach (var genre in existingGenres)
        {
            _unitOfWork.TitleGenres.Remove(genre);
        }

        foreach (var genreId in request.GenreIds)
        {
            title.TitleGenres.Add(new TitleGenre
            {
                TitleId = title.Id,
                GenreId = genreId
            });
        }

        await _unitOfWork.Titles.UpdateAsync(title);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(title.Id);
    }

    public async Task DeleteAsync(Guid userId, Guid titleId)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(titleId);
        if (title == null)
            throw new NotFoundException("Title", titleId);

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        if (title.PublisherId != userId && user.Role != UserRole.Administrator)
            throw new ForbiddenException();

        await _unitOfWork.Titles.DeleteAsync(title);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<PagedResponse<TitleDto>> GetUserTitlesAsync(Guid userId, int page, int pageSize)
    {
        var result = await _unitOfWork.Titles.GetByPublisherAsync(userId, page, pageSize);

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
}
