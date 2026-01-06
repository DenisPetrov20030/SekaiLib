using Microsoft.AspNetCore.Mvc;
using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITitleService _titleService;

    public UsersController(IUnitOfWork unitOfWork, ITitleService titleService)
    {
        _unitOfWork = unitOfWork;
        _titleService = titleService;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(Guid id)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(id);
        if (user == null)
            return NotFound();

        var userProfile = new UserProfileDto(
            user.Id,
            user.Username,
            user.Email,
            user.AvatarUrl,
            user.CreatedAt
        );

        return Ok(userProfile);
    }

    [HttpGet("{id}/titles")]
    public async Task<ActionResult<PagedResponse<TitleDto>>> GetUserTitles(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _titleService.GetUserTitlesAsync(id, page, pageSize);
        return Ok(result);
    }
}
