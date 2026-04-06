using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Teams;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class TranslationTeamService : ITranslationTeamService
{
    private readonly IUnitOfWork _unitOfWork;

    public TranslationTeamService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<TranslationTeamDto>> GetAllAsync()
    {
        var teams = await _unitOfWork.TranslationTeams.Query()
            .Include(t => t.Owner)
            .Include(t => t.Members)
            .Include(t => t.Subscriptions)
            .Include(t => t.Chapters)
            .OrderBy(t => t.Name)
            .ToListAsync();

        return teams.Select(MapToDto);
    }

    public async Task<TranslationTeamDto> GetByIdAsync(Guid teamId)
    {
        var team = await GetTeamWithDetailsAsync(teamId);
        return MapToDto(team);
    }

    public async Task<TranslationTeamDto> CreateAsync(Guid userId, CreateTeamRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new UnauthorizedException();

        var team = new TranslationTeam
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            AvatarUrl = request.AvatarUrl,
            OwnerId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.TranslationTeams.AddAsync(team);

        var ownerMember = new TranslationTeamMember
        {
            TeamId = team.Id,
            UserId = userId,
            Role = TeamMemberRole.Owner,
            JoinedAt = DateTime.UtcNow
        };
        await _unitOfWork.TranslationTeamMembers.AddAsync(ownerMember);

        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(team.Id);
    }

    public async Task<TranslationTeamDto> UpdateAsync(Guid userId, Guid teamId, UpdateTeamRequest request)
    {
        var team = await GetTeamWithDetailsAsync(teamId);
        var member = team.Members.FirstOrDefault(m => m.UserId == userId);

        if (member == null || (member.Role != TeamMemberRole.Owner && member.Role != TeamMemberRole.Admin))
            throw new ForbiddenException();

        team.Name = request.Name;
        team.Description = request.Description;
        team.AvatarUrl = request.AvatarUrl;

        await _unitOfWork.TranslationTeams.UpdateAsync(team);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(teamId);
    }

    public async Task DeleteAsync(Guid userId, Guid teamId)
    {
        var team = await GetTeamWithDetailsAsync(teamId);

        if (team.OwnerId != userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null || user.Role != UserRole.Administrator)
                throw new ForbiddenException();
        }

        await _unitOfWork.TranslationTeams.DeleteAsync(team);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<TeamMemberDto>> GetMembersAsync(Guid teamId)
    {
        var teamExists = await _unitOfWork.TranslationTeams.ExistsAsync(teamId);
        if (!teamExists)
            throw new NotFoundException("TranslationTeam", teamId);

        var members = await _unitOfWork.TranslationTeamMembers.Query()
            .Include(m => m.User)
            .Where(m => m.TeamId == teamId)
            .OrderBy(m => m.Role)
            .ThenBy(m => m.JoinedAt)
            .ToListAsync();

        return members.Select(m => new TeamMemberDto(
            m.UserId, m.User.Username, m.User.AvatarUrl, m.Role, m.JoinedAt));
    }

    public async Task<TeamMemberDto> AddMemberAsync(Guid requesterId, Guid teamId, AddMemberRequest request)
    {
        var team = await GetTeamWithDetailsAsync(teamId);
        var requesterMember = team.Members.FirstOrDefault(m => m.UserId == requesterId);

        if (requesterMember == null || (requesterMember.Role != TeamMemberRole.Owner && requesterMember.Role != TeamMemberRole.Admin))
            throw new ForbiddenException();

        if (request.Role == TeamMemberRole.Owner)
            throw new ForbiddenException();

        var existing = team.Members.FirstOrDefault(m => m.UserId == request.UserId);
        if (existing != null)
            throw new ValidationException(new Dictionary<string, string[]>
            {
                { "userId", new[] { "Користувач вже є учасником команди" } }
            });

        var targetUser = await _unitOfWork.Users.GetByIdAsync(request.UserId);
        if (targetUser == null)
            throw new NotFoundException("User", request.UserId);

        var member = new TranslationTeamMember
        {
            TeamId = teamId,
            UserId = request.UserId,
            Role = request.Role,
            JoinedAt = DateTime.UtcNow
        };

        await _unitOfWork.TranslationTeamMembers.AddAsync(member);
        await _unitOfWork.SaveChangesAsync();

        return new TeamMemberDto(targetUser.Id, targetUser.Username, targetUser.AvatarUrl, member.Role, member.JoinedAt);
    }

    public async Task RemoveMemberAsync(Guid requesterId, Guid teamId, Guid targetUserId)
    {
        var team = await GetTeamWithDetailsAsync(teamId);
        var requesterMember = team.Members.FirstOrDefault(m => m.UserId == requesterId);

        var canManage = requesterMember != null &&
            (requesterMember.Role == TeamMemberRole.Owner || requesterMember.Role == TeamMemberRole.Admin);

        if (!canManage && requesterId != targetUserId)
            throw new ForbiddenException();

        var targetMember = team.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMember == null)
            throw new NotFoundException("TeamMember", targetUserId);

        if (targetMember.Role == TeamMemberRole.Owner && requesterId != targetUserId)
            throw new ForbiddenException();

        await _unitOfWork.TranslationTeamMembers.DeleteAsync(targetMember);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<TeamMemberDto> UpdateMemberRoleAsync(Guid requesterId, Guid teamId, Guid targetUserId, UpdateMemberRoleRequest request)
    {
        var team = await GetTeamWithDetailsAsync(teamId);
        var requesterMember = team.Members.FirstOrDefault(m => m.UserId == requesterId);

        if (requesterMember == null || requesterMember.Role != TeamMemberRole.Owner)
            throw new ForbiddenException();

        if (request.Role == TeamMemberRole.Owner)
            throw new ForbiddenException();

        var targetMember = team.Members.FirstOrDefault(m => m.UserId == targetUserId);
        if (targetMember == null)
            throw new NotFoundException("TeamMember", targetUserId);

        if (targetMember.Role == TeamMemberRole.Owner)
            throw new ForbiddenException();

        targetMember.Role = request.Role;
        await _unitOfWork.SaveChangesAsync();

        var user = await _unitOfWork.Users.GetByIdAsync(targetUserId);
        return new TeamMemberDto(user!.Id, user.Username, user.AvatarUrl, targetMember.Role, targetMember.JoinedAt);
    }

    public async Task<bool> SubscribeAsync(Guid userId, Guid teamId)
    {
        var teamExists = await _unitOfWork.TranslationTeams.ExistsAsync(teamId);
        if (!teamExists)
            throw new NotFoundException("TranslationTeam", teamId);

        var existing = await _unitOfWork.TranslationTeamSubscriptions.Query()
            .FirstOrDefaultAsync(s => s.TeamId == teamId && s.UserId == userId);

        if (existing != null)
            return false;

        var subscription = new TranslationTeamSubscription
        {
            TeamId = teamId,
            UserId = userId,
            SubscribedAt = DateTime.UtcNow
        };

        await _unitOfWork.TranslationTeamSubscriptions.AddAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task UnsubscribeAsync(Guid userId, Guid teamId)
    {
        var subscription = await _unitOfWork.TranslationTeamSubscriptions.Query()
            .FirstOrDefaultAsync(s => s.TeamId == teamId && s.UserId == userId);

        if (subscription == null)
            return;

        await _unitOfWork.TranslationTeamSubscriptions.DeleteAsync(subscription);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<bool> IsSubscribedAsync(Guid userId, Guid teamId)
    {
        return await _unitOfWork.TranslationTeamSubscriptions.Query()
            .AnyAsync(s => s.TeamId == teamId && s.UserId == userId);
    }

    public async Task<(IEnumerable<ChapterDto> Items, int TotalCount)> GetTeamChaptersAsync(Guid teamId, int page, int pageSize)
    {
        var teamExists = await _unitOfWork.TranslationTeams.ExistsAsync(teamId);
        if (!teamExists)
            throw new NotFoundException("TranslationTeam", teamId);

        var query = _unitOfWork.Chapters.Query()
            .Include(c => c.TranslationTeam)
            .Where(c => c.TranslationTeamId == teamId)
            .OrderByDescending(c => c.PublishedAt);

        var totalCount = await query.CountAsync();
        var chapters = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = chapters.Select(c => new ChapterDto(
            c.Id,
            c.Number,
            c.Name,
            c.PublishedAt,
            c.IsPremium,
            c.TranslationTeamId,
            c.TranslationTeam?.Name
        ));

        return (dtos, totalCount);
    }

    public async Task<IEnumerable<TranslationTeamDto>> GetUserTeamsAsync(Guid userId, bool canAddChaptersOnly = false)
    {
        var query = _unitOfWork.TranslationTeamMembers.Query()
            .Include(m => m.Team)
                .ThenInclude(t => t.Owner)
            .Include(m => m.Team)
                .ThenInclude(t => t.Members)
            .Include(m => m.Team)
                .ThenInclude(t => t.Subscriptions)
            .Include(m => m.Team)
                .ThenInclude(t => t.Chapters)
            .Where(m => m.UserId == userId);

        if (canAddChaptersOnly)
            query = query.Where(m => m.Role != TeamMemberRole.Admin);

        var memberships = await query.ToListAsync();
        return memberships.Select(m => MapToDto(m.Team));
    }

    public async Task<IEnumerable<SubscribedTeamChapterDto>> GetRecentChaptersFromSubscribedTeamsAsync(Guid userId, int count)
    {
        var subscribedTeamIds = await _unitOfWork.TranslationTeamSubscriptions.Query()
            .Where(s => s.UserId == userId)
            .Select(s => s.TeamId)
            .ToListAsync();

        if (subscribedTeamIds.Count == 0)
            return [];

        var chapters = await _unitOfWork.Chapters.Query()
            .Include(c => c.Title)
            .Include(c => c.TranslationTeam)
            .Where(c => c.TranslationTeamId.HasValue && subscribedTeamIds.Contains(c.TranslationTeamId.Value))
            .OrderByDescending(c => c.PublishedAt)
            .Take(count)
            .ToListAsync();

        return chapters.Select(c => new SubscribedTeamChapterDto(
            c.Id,
            c.Number,
            c.Name,
            c.PublishedAt,
            c.IsPremium,
            c.TitleId,
            c.Title.Name,
            c.Title.CoverImageUrl,
            c.TranslationTeamId!.Value,
            c.TranslationTeam!.Name
        ));
    }

    private async Task<TranslationTeam> GetTeamWithDetailsAsync(Guid teamId)
    {
        var team = await _unitOfWork.TranslationTeams.Query()
            .Include(t => t.Owner)
            .Include(t => t.Members)
                .ThenInclude(m => m.User)
            .Include(t => t.Subscriptions)
            .Include(t => t.Chapters)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
            throw new NotFoundException("TranslationTeam", teamId);

        return team;
    }

    private static TranslationTeamDto MapToDto(TranslationTeam team) =>
        new(
            team.Id,
            team.Name,
            team.Description,
            team.AvatarUrl,
            team.OwnerId,
            team.Owner?.Username ?? string.Empty,
            team.Members.Count,
            team.Chapters.Count,
            team.Subscriptions.Count,
            team.CreatedAt
        );
}
