using SekaiLib.Domain.Enums;
using SekaiLib.Application.DTOs.ReadingLists;

namespace SekaiLib.Application.Interfaces;

public interface IReadingListService
{
    Task<IEnumerable<ReadingListDto>> GetUserListsAsync(Guid userId);
    Task<ReadingStatus?> GetTitleStatusAsync(Guid userId, Guid titleId);
    Task AddToListAsync(Guid userId, Guid titleId, ReadingStatus status);
    Task UpdateStatusAsync(Guid userId, Guid titleId, ReadingStatus status);
    Task RemoveFromListAsync(Guid userId, Guid titleId);
}
