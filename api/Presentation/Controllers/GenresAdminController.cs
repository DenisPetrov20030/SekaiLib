using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/admin/genres")]
[Authorize]
public class GenresAdminController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IReadCacheService _readCache;

    public GenresAdminController(IUnitOfWork unitOfWork, IReadCacheService readCache)
    {
        _unitOfWork = unitOfWork;
        _readCache = readCache;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<GenreDto>>> GetAll()
    {
        var cached = await _readCache.GetAsync<List<GenreDto>>("genres:all");
        if (cached != null) return Ok(cached);

        var genres = await _unitOfWork.Genres.GetAllAsync();
        var result = genres.Select(g => new GenreDto(g.Id, g.Name)).ToList();
        await _readCache.SetAsync("genres:all", result, TimeSpan.FromMinutes(60));
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<GenreDto>> Create([FromBody] CreateGenreRequest request)
    {
        var existingGenres = await _unitOfWork.Genres.GetAllAsync();
        var existingGenre = existingGenres.FirstOrDefault(g => g.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase));
        
        if (existingGenre != null)
        {
            return BadRequest(new { message = $"Жанр з назвою '{request.Name}' вже існує" });
        }

        var baseSlug = request.Name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "");

        var slug = baseSlug;
        var counter = 1;
        
        while (existingGenres.Any(g => g.Slug == slug))
        {
            slug = $"{baseSlug}-{counter}";
            counter++;
        }

        var genre = new Genre
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Slug = slug
        };

        await _unitOfWork.Genres.AddAsync(genre);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("genres:all");

        return CreatedAtAction(nameof(GetAll), new { id = genre.Id }, new GenreDto(genre.Id, genre.Name));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GenreDto>> Update(Guid id, [FromBody] UpdateGenreRequest request)
    {
        var genre = await _unitOfWork.Genres.GetByIdAsync(id);
        if (genre == null)
            return NotFound();

        genre.Name = request.Name;
        genre.Slug = request.Name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("'", "")
            .Replace("\"", "");

        await _unitOfWork.Genres.UpdateAsync(genre);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("genres:all");

        return Ok(new GenreDto(genre.Id, genre.Name));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var genre = await _unitOfWork.Genres.GetByIdAsync(id);
        if (genre == null)
            return NotFound();

        await _unitOfWork.Genres.DeleteAsync(genre);
        await _unitOfWork.SaveChangesAsync();
        await _readCache.RemoveAsync("genres:all");

        return NoContent();
    }
}

public record CreateGenreRequest(string Name);
public record UpdateGenreRequest(string Name);
