using SekaiLib.Application.DTOs.ReadingLists;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Enums;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class ReadingListService : IReadingListService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReadingListService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ReadingListDto>> GetUserListsAsync(Guid userId)
    {
        var readingLists = await _unitOfWork.ReadingLists.GetByUserIdAsync(userId);

        return readingLists.Select(rl => new ReadingListDto(
            rl.TitleId,
            new ReadingListTitleDto(
                rl.Title.Id,
                rl.Title.Name,
                rl.Title.Author,
                rl.Title.CoverImageUrl,
                rl.Title.Status
            ),
            rl.Status,
            rl.UserListId, 
            rl.AddedAt     
        ));
    }

   public async Task<ReadingStatusResponse> GetTitleStatusAsync(Guid userId, Guid titleId)
{
    var item = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, titleId);
    // Повертаємо і системний статус, і ID кастомного списку
    return new ReadingStatusResponse(item?.Status, item?.UserListId);
}

    public async Task AddToListAsync(Guid userId, UpdateReadingStatusRequest request)
    {
        var titleExists = await _unitOfWork.Titles.ExistsAsync(request.TitleId);
        if (!titleExists)
            throw new NotFoundException("Title", request.TitleId);

        var existing = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, request.TitleId);
        if (existing != null)
            throw new ValidationException("Title", "Title is already in your reading list");

      var readingList = new ReadingList
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        TitleId = request.TitleId,
        Status = request.Status ?? ReadingStatus.Planned, // Ставимо дефолт, якщо це кастомний список
        UserListId = request.UserListId, // ТЕПЕР ЦЕ ЗБЕРЕЖЕТЬСЯ
        AddedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow
    };

        await _unitOfWork.ReadingLists.AddAsync(readingList);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(Guid userId, Guid titleId, UpdateReadingStatusRequest request)
{
    var readingList = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, titleId);
    if (readingList == null) throw new NotFoundException("Reading list entry not found");

    // Якщо прийшов новий статус — оновлюємо, якщо null — залишаємо старий
    if (request.Status.HasValue) 
        readingList.Status = request.Status.Value;

    // Якщо прийшов ID списку — оновлюємо, якщо null — залишаємо старий
    if (request.UserListId.HasValue)
        readingList.UserListId = request.UserListId.Value;

    readingList.UpdatedAt = DateTime.UtcNow;

    await _unitOfWork.ReadingLists.UpdateAsync(readingList);
    await _unitOfWork.SaveChangesAsync();
}

    public async Task RemoveFromListAsync(Guid userId, Guid titleId)
    {
        var readingList = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, titleId);
        if (readingList == null)
            throw new NotFoundException("Reading list entry not found");

        await _unitOfWork.ReadingLists.DeleteAsync(readingList);
        await _unitOfWork.SaveChangesAsync();
    }
}