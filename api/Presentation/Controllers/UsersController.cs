using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SekaiLib.Application.DTOs;
using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Application.DTOs.Users;
using SekaiLib.Application.DTOs.Notifications;
using Microsoft.EntityFrameworkCore;

namespace SekaiLib.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITitleService _titleService;
    private readonly INotificationService _notifications;
    private readonly ILogger<UsersController> _logger;
    public UsersController(IUnitOfWork unitOfWork, ITitleService titleService, INotificationService notifications, ILogger<UsersController> logger)
{
    _unitOfWork = unitOfWork;
    _titleService = titleService;
    _notifications = notifications;
    _logger = logger; 
}

    [HttpGet("{id}")]
    public async Task<ActionResult<UserProfileDto>> GetProfile(Guid id)
    {
        _logger.LogInformation("Отримано запит профілю для ID: {UserId}", id);
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

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileDto>> GetCurrentUserProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        
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

    [HttpGet("{id:guid}/friends")]
    public async Task<ActionResult<IEnumerable<FriendDto>>> GetFriends(Guid id)
    {
        var exists = await _unitOfWork.Users.ExistsAsync(id);
        if (!exists)
            return NotFound();

        var friendIds = await _unitOfWork.Friendships.Query()
            .Where(f => f.UserAId == id || f.UserBId == id)
            .Select(f => f.UserAId == id ? f.UserBId : f.UserAId)
            .ToListAsync();

        if (friendIds.Count == 0)
            return Ok(Enumerable.Empty<FriendDto>());

        var friends = await _unitOfWork.Users.Query()
            .Where(u => friendIds.Contains(u.Id))
            .OrderBy(u => u.Username)
            .Select(u => new FriendDto(u.Id, u.Username, u.AvatarUrl))
            .ToListAsync();

        return Ok(friends);
    }

    [HttpGet("{id:guid}/friends/count")]
    public async Task<ActionResult> GetFriendsCount(Guid id)
    {
        var exists = await _unitOfWork.Users.ExistsAsync(id);
        if (!exists)
            return NotFound();

        var count = await _unitOfWork.Friendships.CountAsync(f => f.UserAId == id || f.UserBId == id);
        return Ok(new { count });
    }
    [Authorize]
    [HttpGet("reading-progress")]
    public async Task<ActionResult<IEnumerable<ReadingProgressDto>>> GetReadingProgress()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
        var userId = Guid.Parse(userIdClaim);

        var progresses = await _unitOfWork.UserReadingProgresses
            .Query()
            .Include(p => p.Title)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.LastReadAt)
            .ToListAsync();

        if (progresses.Count == 0) return Ok(Enumerable.Empty<ReadingProgressDto>());

        var latestByTitle = progresses
            .GroupBy(p => p.TitleId)
            .Select(g => g.OrderByDescending(x => x.LastReadAt).First())
            .OrderByDescending(x => x.LastReadAt)
            .ToList();

        var result = new List<ReadingProgressDto>();

        foreach (var progress in latestByTitle)
        {
            var chapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(progress.TitleId, progress.ChapterNumber);
            var totalPages = 0;

            if (chapter != null && !string.IsNullOrWhiteSpace(chapter.Content))
            {
                totalPages = CountTotalPages(chapter.Content);
            }

            if (totalPages <= 0 || totalPages <= progress.CurrentPage)
            {
                totalPages = Math.Max(progress.CurrentPage + 1, 1);
            }

            result.Add(new ReadingProgressDto(
                progress.TitleId,
                progress.Title!.Name,
                progress.Title.CoverImageUrl ?? "",
                progress.ChapterNumber,
                progress.CurrentPage,
                totalPages
            ));
        }

        return Ok(result);
    }
[Authorize]
[HttpPost("update-progress")]
public async Task<IActionResult> UpdateProgress([FromBody] UpdateProgressRequest request)
{
    var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

    var progress = await _unitOfWork.UserReadingProgresses
        .Query()
        .FirstOrDefaultAsync(p => p.UserId == userId && p.TitleId == request.TitleId);

    if (progress == null)
    {
        progress = new UserReadingProgress
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TitleId = request.TitleId
        };
        await _unitOfWork.UserReadingProgresses.AddAsync(progress);
    }

    progress.ChapterNumber = request.ChapterNumber;
    progress.CurrentPage = request.Page;
    progress.LastReadAt = DateTime.UtcNow;

    await _unitOfWork.SaveChangesAsync();
    return Ok();
}

[Authorize]
[HttpDelete("reading-progress")]
public async Task<IActionResult> ClearReadingProgress()
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = Guid.Parse(userIdClaim);

    var progresses = await _unitOfWork.UserReadingProgresses
        .Query()
        .Where(p => p.UserId == userId)
        .ToListAsync();

    if (progresses.Count == 0)
        return NoContent();

    foreach (var p in progresses)
        await _unitOfWork.UserReadingProgresses.DeleteAsync(p);

    await _unitOfWork.SaveChangesAsync();
    return NoContent();
}

[Authorize]
[HttpDelete("reading-progress/{titleId:guid}")]
public async Task<IActionResult> ClearReadingProgressForTitle(Guid titleId)
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = Guid.Parse(userIdClaim);

    var progresses = await _unitOfWork.UserReadingProgresses
        .Query()
        .Where(p => p.UserId == userId && p.TitleId == titleId)
        .ToListAsync();

    if (progresses.Count == 0)
        return NoContent();

    foreach (var p in progresses)
        await _unitOfWork.UserReadingProgresses.DeleteAsync(p);

    await _unitOfWork.SaveChangesAsync();
    return NoContent();
}

[Authorize]
[HttpGet("{id:guid}/friendship")]
public async Task<IActionResult> GetFriendshipStatus(Guid id)
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    if (me == id) return Ok(new { isFriend = false });

    var userA = me.CompareTo(id) < 0 ? me : id;
    var userB = me.CompareTo(id) < 0 ? id : me;

    var isFriend = await _unitOfWork.Friendships.Query()
        .AnyAsync(f => f.UserAId == userA && f.UserBId == userB);

    return Ok(new { isFriend });
}

[Authorize]
[HttpPost("{id:guid}/friends")]
public async Task<IActionResult> AddFriend(Guid id)
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    if (me == id) 
    {
        _logger.LogWarning("Користувач {UserId} намагався додати самого себе в друзі", me);
        return BadRequest("Не можна додати себе в друзі.");
    }

    var otherUserExists = await _unitOfWork.Users.ExistsAsync(id);
    if (!otherUserExists)
    {
        _logger.LogWarning("Користувач {Me} намагався додати неіснуючого юзера {TargetId}", me, id);
        return NotFound("Користувача не знайдено.");
    }

    var userA = me.CompareTo(id) < 0 ? me : id;
    var userB = me.CompareTo(id) < 0 ? id : me;

    var exists = await _unitOfWork.Friendships.Query()
        .AnyAsync(f => f.UserAId == userA && f.UserBId == userB);

    if (exists)
    {
        return Ok(new { added = false, message = "Ви вже у друзях." });
    }

    await _unitOfWork.Friendships.AddAsync(new Friendship
    {
        Id = Guid.NewGuid(),
        UserAId = userA,
        UserBId = userB,
        CreatedAt = DateTime.UtcNow
    });

    await _unitOfWork.SaveChangesAsync();
    
    _logger.LogInformation("Користувачі {UserA} та {UserB} тепер друзі", userA, userB);
    return Ok(new { added = true });
}

[Authorize]
[HttpDelete("{id:guid}/friends")]
public async Task<IActionResult> RemoveFriend(Guid id)
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    if (me == id)
        return BadRequest("Не можна видалити себе з друзів.");

    var userA = me.CompareTo(id) < 0 ? me : id;
    var userB = me.CompareTo(id) < 0 ? id : me;

    var friendship = await _unitOfWork.Friendships.Query()
        .FirstOrDefaultAsync(f => f.UserAId == userA && f.UserBId == userB);

    if (friendship == null)
        return NoContent();

    await _unitOfWork.Friendships.DeleteAsync(friendship);
    await _unitOfWork.SaveChangesAsync();
    return NoContent();
}

[Authorize]
[HttpPost("friend-requests/{id:guid}/send")]
public async Task<IActionResult> SendFriendRequest(Guid id)
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    if (me == id)
        return BadRequest("Не можна відправити заявку собі.");

    var otherUserExists = await _unitOfWork.Users.ExistsAsync(id);
    if (!otherUserExists)
        return NotFound("Користувача не знайдено.");

    var alreadyFriends = await _unitOfWork.Friendships.Query()
        .AnyAsync(f => (f.UserAId == me && f.UserBId == id) || (f.UserAId == id && f.UserBId == me));
    if (alreadyFriends)
        return BadRequest("Ви вже у друзях.");

    var existingRequest = await _unitOfWork.FriendRequests.Query()
        .FirstOrDefaultAsync(fr => fr.FromUserId == me && fr.ToUserId == id && fr.Status == FriendRequestStatus.Pending);
    if (existingRequest != null)
        return BadRequest("Заявка вже відправлена.");

    var request = new FriendRequest
    {
        Id = Guid.NewGuid(),
        FromUserId = me,
        ToUserId = id,
        Status = FriendRequestStatus.Pending,
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

    await _unitOfWork.FriendRequests.AddAsync(request);
    await _unitOfWork.SaveChangesAsync();

    var sender = await _unitOfWork.Users.GetByIdAsync(me);
    if (sender != null)
    {
        await _notifications.CreateAsync(new CreateNotificationRequest(
            id,
            NotificationType.FriendRequest,
            "Запит у друзі",
            $"{sender.Username} надіслав(ла) запит у друзі",
            $"/users/{id}/friends?tab=incoming",
            me
        ));
    }
    return Ok(new { sent = true });
}

[Authorize]
[HttpGet("friend-requests/incoming")]
public async Task<IActionResult> GetIncomingRequests()
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var requests = await _unitOfWork.FriendRequests.Query()
        .Where(fr => fr.ToUserId == me && fr.Status == FriendRequestStatus.Pending)
        .Include(fr => fr.FromUser)
        .OrderByDescending(fr => fr.CreatedAt)
        .ToListAsync();

    var dtos = requests.Select(r => new FriendRequestDto(
        r.Id,
        r.FromUserId,
        r.FromUser!.Username,
        r.FromUser.AvatarUrl,
        r.ToUserId,
        r.Status,
        r.CreatedAt
    )).ToList();

    return Ok(dtos);
}

[Authorize]
[HttpGet("friend-requests/outgoing")]
public async Task<IActionResult> GetOutgoingRequests()
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var requests = await _unitOfWork.FriendRequests.Query()
        .Where(fr => fr.FromUserId == me && fr.Status == FriendRequestStatus.Pending)
        .Include(fr => fr.ToUser)
        .OrderByDescending(fr => fr.CreatedAt)
        .ToListAsync();

    var dtos = requests.Select(r => new FriendRequestDto(
        r.Id,
        r.ToUserId,
        r.ToUser!.Username,
        r.ToUser.AvatarUrl,
        r.FromUserId,
        r.Status,
        r.CreatedAt
    )).ToList();

    return Ok(dtos);
}

[Authorize]
[HttpPut("friend-requests/{requestId:guid}/accept")]
public async Task<IActionResult> AcceptFriendRequest(Guid requestId)
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var request = await _unitOfWork.FriendRequests.GetByIdAsync(requestId);
    if (request == null)
        return NotFound("Заявку не знайдено.");

    if (request.ToUserId != me)
        return StatusCode(StatusCodes.Status403Forbidden, "Ви не можете прийняти цю заявку.");

    if (request.Status != FriendRequestStatus.Pending)
        return BadRequest("Заявка вже оброблена.");

    request.Status = FriendRequestStatus.Accepted;
    request.UpdatedAt = DateTime.UtcNow;

    var userA = request.FromUserId.CompareTo(request.ToUserId) < 0 ? request.FromUserId : request.ToUserId;
    var userB = request.FromUserId.CompareTo(request.ToUserId) < 0 ? request.ToUserId : request.FromUserId;

    var friendship = new Friendship
    {
        Id = Guid.NewGuid(),
        UserAId = userA,
        UserBId = userB,
        CreatedAt = DateTime.UtcNow
    };

    await _unitOfWork.FriendRequests.UpdateAsync(request);
    await _unitOfWork.Friendships.AddAsync(friendship);
    await _unitOfWork.SaveChangesAsync();

    return Ok(new { accepted = true });
}

[Authorize]
[HttpPut("friend-requests/{requestId:guid}/reject")]
public async Task<IActionResult> RejectFriendRequest(Guid requestId)
{
    var me = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    var request = await _unitOfWork.FriendRequests.GetByIdAsync(requestId);
    if (request == null)
        return NotFound("Заявку не знайдено.");

    if (request.ToUserId != me && request.FromUserId != me)
        return StatusCode(StatusCodes.Status403Forbidden, "Ви не можете відхилити цю заявку.");

    if (request.Status != FriendRequestStatus.Pending)
        return BadRequest("Заявка вже оброблена.");

    request.Status = FriendRequestStatus.Rejected;
    request.UpdatedAt = DateTime.UtcNow;

    await _unitOfWork.FriendRequests.UpdateAsync(request);
    await _unitOfWork.SaveChangesAsync();

    return Ok(new { rejected = true });
}

    private static int CountTotalPages(string content)
    {
        var lines = content.Split('\n');
        var count = 0;
        foreach (var line in lines)
        {
            if (!string.IsNullOrWhiteSpace(line))
                count++;
        }
        return count;
    }

    public record UpdateProgressRequest(Guid TitleId, int ChapterNumber, int Page);

    [Authorize]
[HttpPost("me/avatar")]
[Consumes("multipart/form-data")]
public async Task<IActionResult> UploadAvatar(IFormFile avatar)
{
    var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
    var userId = Guid.Parse(userIdClaim);

    try 
    {
        if (avatar == null || avatar.Length == 0)
        {
            _logger.LogWarning("Користувач {UserId} намагався завантажити порожній файл аватара", userId);
            return BadRequest("Файл аватару відсутній або порожній.");
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null) 
        {
            _logger.LogWarning("Користувача {UserId} не знайдено для оновлення аватара", userId);
            return NotFound();
        }

        var uploadsRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "SekaiLib",
            "uploads",
            "avatars");

        if (!Directory.Exists(uploadsRoot)) Directory.CreateDirectory(uploadsRoot);

        var ext = Path.GetExtension(avatar.FileName).ToLowerInvariant();
        var allowed = new[] { ".png", ".jpg", ".jpeg", ".webp" };
        if (!allowed.Contains(ext)) 
        {
            _logger.LogInformation("Відхилено завантаження файлу з непідтримуваним розширенням {Ext} від {UserId}", ext, userId);
            return BadRequest("Підтримуються лише PNG/JPG/JPEG/WEBP.");
        }

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsRoot, fileName);
        
        using (var stream = System.IO.File.Create(filePath))
        {
            await avatar.CopyToAsync(stream);
        }

        var request = HttpContext.Request;
        var baseUrl = $"{request.Scheme}://{request.Host}";
        var relativePath = $"/uploads/avatars/{fileName}";
        user.AvatarUrl = baseUrl + relativePath;

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Користувач {UserId} успішно оновив аватар: {Url}", userId, user.AvatarUrl);
        return Ok(new { avatarUrl = user.AvatarUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Критична помилка при завантаженні аватара користувачем {UserId}", userId);
        return StatusCode(500, "Помилка сервера при обробці зображення");
    }
}

