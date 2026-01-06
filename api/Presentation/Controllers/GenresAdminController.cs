using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/admin/genres")]
[Authorize(Roles = "Administrator")]
public class GenresAdminController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public GenresAdminController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<GenreDto>>> GetAll()
    {
        var genres = await _unitOfWork.Genres.GetAllAsync();
        return Ok(genres.Select(g => new GenreDto(g.Id, g.Name)));
    }

    [HttpPost]
    public async Task<ActionResult<GenreDto>> Create([FromBody] CreateGenreRequest request)
    {
        var genre = new Genre
        {
            Id = Guid.NewGuid(),
            Name = request.Name
        };

        await _unitOfWork.Genres.AddAsync(genre);
        await _unitOfWork.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = genre.Id }, new GenreDto(genre.Id, genre.Name));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GenreDto>> Update(Guid id, [FromBody] UpdateGenreRequest request)
    {
        var genre = await _unitOfWork.Genres.GetByIdAsync(id);
        if (genre == null)
            return NotFound();

        genre.Name = request.Name;
        await _unitOfWork.Genres.UpdateAsync(genre);
        await _unitOfWork.SaveChangesAsync();

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

        return NoContent();
    }
}

public record CreateGenreRequest(string Name);
public record UpdateGenreRequest(string Name);
