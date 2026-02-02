using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.ReadingLists;

public record ReadingListTitleDto(
    Guid Id,
    string Name,
    string Author,
    string? CoverImageUrl,
    TitleStatus Status
);

public record ReadingListDto(
    Guid TitleId,
    ReadingListTitleDto Title,
    ReadingStatus? Status, // Змінено на nullable
    Guid? UserListId,      // Додано для кастомних списків
    DateTime AddedAt
);

// Модель для отримання статусу (використовується в GET .../status)
public record ReadingStatusResponse(
    ReadingStatus? Status,
    Guid? UserListId
);

// Модель для запитів на додавання/оновлення (POST/PUT)
public record UpdateReadingStatusRequest(
    Guid TitleId,
    ReadingStatus? Status,
    Guid? UserListId
);