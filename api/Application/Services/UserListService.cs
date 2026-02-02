using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;
using SekaiLib.Application.DTOs.UserLists;
using SekaiLib.Application.DTOs.ReadingLists;

namespace SekaiLib.Application.Services;

public class UserListService // Додав інтерфейс, якщо він у вас є
{
    private readonly IUnitOfWork _unitOfWork;
    public UserListService(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task CreateListAsync(Guid userId, string name)
    {
        var count = await _unitOfWork.UserLists.CountAsync(x => x.UserId == userId);
        if (count >= 5) 
            throw new Exception("Ви досягли ліміту: можна створити не більше 5 кастомних списків.");

        var newList = new UserList { 
            Id = Guid.NewGuid(), 
            UserId = userId, 
            Name = name, 
            CreatedAt = DateTime.UtcNow 
        };

        await _unitOfWork.UserLists.AddAsync(newList);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<UserListDto>> GetUserListsAsync(Guid userId)
    {
        var lists = await _unitOfWork.UserLists.GetUserListsWithTitlesAsync(userId);

        return lists.Select(l => new UserListDto(
            l.Id,
            l.Name,
            l.UserId,
            l.Description,
            l.ReadingListItems.Count(ri => ri.Title != null), // кількість тайтлів
            l.CreatedAt,
            l.ReadingListItems
                .Where(ri => ri.Title != null) // Захист від порожніх тайтлів
                .Select(ri => new ReadingListTitleDto(
                    ri.Title.Id,
                    ri.Title.Name,
                    ri.Title.Author,
                    ri.Title.CoverImageUrl,
                    ri.Title.Status
                )).ToList()
        ));
    }

    public async Task DeleteListAsync(Guid userId, Guid listId)
    {
        var list = await _unitOfWork.UserLists.GetByIdAsync(listId);
        if (list == null || list.UserId != userId)
            throw new Exception("Список не знайдено або доступ заборонено.");

        await _unitOfWork.UserLists.DeleteAsync(list);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<UserListDto?> GetUserListByIdAsync(Guid userId, Guid listId)
    {
        // Використовуємо репозиторний метод, який підвантажує ReadingListItems з Title
        var lists = await _unitOfWork.UserLists.GetUserListsWithTitlesAsync(userId);
        var list = lists.FirstOrDefault(l => l.Id == listId);
        if (list == null) return null;

        var dto = new UserListDto(
            list.Id,
            list.Name,
            list.UserId,
            list.Description,
            list.ReadingListItems.Count(ri => ri.Title != null),
            list.CreatedAt,
            list.ReadingListItems
                .Where(ri => ri.Title != null)
                .Select(ri => new ReadingListTitleDto(
                    ri.Title.Id,
                    ri.Title.Name,
                    ri.Title.Author,
                    ri.Title.CoverImageUrl,
                    ri.Title.Status
                )).ToList()
        );

        return dto;
    }
}