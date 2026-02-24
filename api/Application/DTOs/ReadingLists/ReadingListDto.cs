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
    ReadingStatus? Status, 
    Guid? UserListId,      
    DateTime AddedAt
);

public record ReadingStatusResponse(
    ReadingStatus? Status,
    Guid? UserListId
);

public record UpdateReadingStatusRequest(
    Guid TitleId,
    ReadingStatus? Status,
    Guid? UserListId
);
