using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.DTOs.Teams;

namespace SekaiLib.Application.Interfaces;

public interface ITranslationTeamService
{
    Task<IEnumerable<TranslationTeamDto>> GetAllAsync();
    Task<TranslationTeamDto> GetByIdAsync(Guid teamId);
    Task<TranslationTeamDto> CreateAsync(Guid userId, CreateTeamRequest request);
    Task<TranslationTeamDto> UpdateAsync(Guid userId, Guid teamId, UpdateTeamRequest request);
    Task DeleteAsync(Guid userId, Guid teamId);

    Task<IEnumerable<TeamMemberDto>> GetMembersAsync(Guid teamId);
    Task<TeamMemberDto> AddMemberAsync(Guid requesterId, Guid teamId, AddMemberRequest request);
    Task RemoveMemberAsync(Guid requesterId, Guid teamId, Guid targetUserId);
    Task<TeamMemberDto> UpdateMemberRoleAsync(Guid requesterId, Guid teamId, Guid targetUserId, UpdateMemberRoleRequest request);

    Task<bool> SubscribeAsync(Guid userId, Guid teamId);
    Task UnsubscribeAsync(Guid userId, Guid teamId);
    Task<bool> IsSubscribedAsync(Guid userId, Guid teamId);

    Task<(IEnumerable<ChapterDto> Items, int TotalCount)> GetTeamChaptersAsync(Guid teamId, int page, int pageSize);
    Task<IEnumerable<SubscribedTeamChapterDto>> GetRecentChaptersFromSubscribedTeamsAsync(Guid userId, int count);
}
