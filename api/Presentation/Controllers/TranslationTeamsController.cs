using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SekaiLib.Application.DTOs.Teams;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/teams")]
public class TranslationTeamsController : ControllerBase
{
    private readonly ITranslationTeamService _teamService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebHostEnvironment _environment;

    public TranslationTeamsController(ITranslationTeamService teamService, IUnitOfWork unitOfWork, IWebHostEnvironment environment)
    {
        _teamService = teamService;
        _unitOfWork = unitOfWork;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TranslationTeamDto>>> GetAll()
    {
        var teams = await _teamService.GetAllAsync();
        return Ok(teams);
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<TranslationTeamDto>>> GetMyTeams([FromQuery] bool canAddChapters = false)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var teams = await _teamService.GetUserTeamsAsync(userId, canAddChapters);
        return Ok(teams);
    }

    [HttpGet("{teamId:guid}")]
    public async Task<ActionResult<TranslationTeamDto>> GetById(Guid teamId)
    {
        var team = await _teamService.GetByIdAsync(teamId);
        return Ok(team);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<TranslationTeamDto>> Create([FromBody] CreateTeamRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var team = await _teamService.CreateAsync(userId, request);
        return CreatedAtAction(nameof(GetById), new { teamId = team.Id }, team);
    }

    [HttpPut("{teamId:guid}")]
    [Authorize]
    public async Task<ActionResult<TranslationTeamDto>> Update(Guid teamId, [FromBody] UpdateTeamRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var team = await _teamService.UpdateAsync(userId, teamId, request);
        return Ok(team);
    }

    [HttpPost("{teamId:guid}/avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(Guid teamId, IFormFile avatar)
    {
        if (avatar == null || avatar.Length == 0)
            return BadRequest("Файл аватару відсутній або порожній.");

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var membership = await _unitOfWork.TranslationTeamMembers.Query()
            .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);

        if (membership == null || (membership.Role != TeamMemberRole.Owner && membership.Role != TeamMemberRole.Admin))
            return Forbid();

        var team = await _unitOfWork.TranslationTeams.GetByIdAsync(teamId);
        if (team == null)
            return NotFound();

        var ext = Path.GetExtension(avatar.FileName).ToLowerInvariant();
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        if (!allowed.Contains(ext))
            return BadRequest("Підтримуються лише PNG/JPG/JPEG/WEBP.");

        var uploadsRoot = Path.Combine(_environment.ContentRootPath, "uploads", "team-avatars");
        Directory.CreateDirectory(uploadsRoot);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsRoot, fileName);

        using (var stream = System.IO.File.Create(filePath))
        {
            await avatar.CopyToAsync(stream);
        }

        team.AvatarUrl = $"/uploads/team-avatars/{fileName}";

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { avatarUrl = team.AvatarUrl });
    }

    [HttpPost("{teamId:guid}/cover")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCover(Guid teamId, IFormFile cover)
    {
        if (cover == null || cover.Length == 0)
            return BadRequest("Файл обкладинки відсутній або порожній.");

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var membership = await _unitOfWork.TranslationTeamMembers.Query()
            .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);

        if (membership == null || (membership.Role != TeamMemberRole.Owner && membership.Role != TeamMemberRole.Admin))
            return Forbid();

        var team = await _unitOfWork.TranslationTeams.GetByIdAsync(teamId);
        if (team == null)
            return NotFound();

        var ext = Path.GetExtension(cover.FileName).ToLowerInvariant();
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        if (!allowed.Contains(ext))
            return BadRequest("Підтримуються лише PNG/JPG/JPEG/WEBP.");

        var uploadsRoot = Path.Combine(_environment.ContentRootPath, "uploads", "team-covers");
        Directory.CreateDirectory(uploadsRoot);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsRoot, fileName);

        using (var stream = System.IO.File.Create(filePath))
        {
            await cover.CopyToAsync(stream);
        }

        team.CoverImageUrl = $"/uploads/team-covers/{fileName}";

        await _unitOfWork.SaveChangesAsync();
        return Ok(new { coverImageUrl = team.CoverImageUrl });
    }

    [HttpDelete("{teamId:guid}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.DeleteAsync(userId, teamId);
        return NoContent();
    }

    // Members

    [HttpGet("{teamId:guid}/members")]
    public async Task<ActionResult<IEnumerable<TeamMemberDto>>> GetMembers(Guid teamId)
    {
        var members = await _teamService.GetMembersAsync(teamId);
        return Ok(members);
    }

    [HttpPost("{teamId:guid}/members")]
    [Authorize]
    public async Task<ActionResult<TeamMemberDto>> AddMember(Guid teamId, [FromBody] AddMemberRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var member = await _teamService.AddMemberAsync(userId, teamId, request);
        return Ok(member);
    }

    [HttpDelete("{teamId:guid}/members/{targetUserId:guid}")]
    [Authorize]
    public async Task<ActionResult> RemoveMember(Guid teamId, Guid targetUserId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.RemoveMemberAsync(userId, teamId, targetUserId);
        return NoContent();
    }

    [HttpPut("{teamId:guid}/members/{targetUserId:guid}/role")]
    [Authorize]
    public async Task<ActionResult<TeamMemberDto>> UpdateMemberRole(Guid teamId, Guid targetUserId, [FromBody] UpdateMemberRoleRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var member = await _teamService.UpdateMemberRoleAsync(userId, teamId, targetUserId, request);
        return Ok(member);
    }

    // Subscriptions

    [HttpPost("{teamId:guid}/subscribe")]
    [Authorize]
    public async Task<ActionResult> Subscribe(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.SubscribeAsync(userId, teamId);
        return NoContent();
    }

    [HttpDelete("{teamId:guid}/subscribe")]
    [Authorize]
    public async Task<ActionResult> Unsubscribe(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await _teamService.UnsubscribeAsync(userId, teamId);
        return NoContent();
    }

    [HttpGet("{teamId:guid}/subscribed")]
    [Authorize]
    public async Task<ActionResult<bool>> IsSubscribed(Guid teamId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _teamService.IsSubscribedAsync(userId, teamId);
        return Ok(result);
    }

    // Recent chapters from all subscribed teams

    [HttpGet("subscribed/chapters")]
    [Authorize]
    public async Task<ActionResult> GetSubscribedChapters([FromQuery] int count = 20)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var chapters = await _teamService.GetRecentChaptersFromSubscribedTeamsAsync(userId, count);
        return Ok(chapters);
    }

    // Chapters (updates feed with pagination)

    [HttpGet("{teamId:guid}/chapters")]
    public async Task<ActionResult> GetChapters(Guid teamId, [FromQuery] int page = 1, [FromQuery] int pageSize = 15)
    {
        var (items, totalCount) = await _teamService.GetTeamChaptersAsync(teamId, page, pageSize);
        return Ok(new
        {
            data = items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }
}
