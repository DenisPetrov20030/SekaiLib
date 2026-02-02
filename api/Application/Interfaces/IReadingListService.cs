using SekaiLib.Domain.Enums;
using SekaiLib.Application.DTOs.ReadingLists;

namespace SekaiLib.Application.Interfaces;

public interface IReadingListService
{
    Task<IEnumerable<ReadingListDto>> GetUserListsAsync(Guid userId);
    Task<ReadingStatusResponse> GetTitleStatusAsync(Guid userId, Guid titleId);
    Task AddToListAsync(Guid userId, UpdateReadingStatusRequest request);
    Task UpdateStatusAsync(Guid userId, Guid titleId, UpdateReadingStatusRequest request);
    Task RemoveFromListAsync(Guid userId, Guid titleId);
}