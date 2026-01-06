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
            rl.AddedAt
        ));
    }

    public async Task<ReadingStatus?> GetTitleStatusAsync(Guid userId, Guid titleId)
    {
        var entry = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, titleId);
        return entry?.Status;
    }

    public async Task AddToListAsync(Guid userId, Guid titleId, ReadingStatus status)
    {
        var titleExists = await _unitOfWork.Titles.ExistsAsync(titleId);
        if (!titleExists)
            throw new NotFoundException("Title", titleId);

        var existing = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, titleId);
        if (existing != null)
            throw new ValidationException("Title", "Title is already in your reading list");

        var readingList = new ReadingList
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TitleId = titleId,
            Status = status,
            AddedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ReadingLists.AddAsync(readingList);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(Guid userId, Guid titleId, ReadingStatus status)
    {
        var readingList = await _unitOfWork.ReadingLists.GetByUserAndTitleAsync(userId, titleId);
        if (readingList == null)
            throw new NotFoundException("Reading list entry not found");

        readingList.Status = status;
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
