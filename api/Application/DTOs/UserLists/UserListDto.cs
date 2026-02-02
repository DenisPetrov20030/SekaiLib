using SekaiLib.Application.DTOs.ReadingLists;

namespace SekaiLib.Application.DTOs.UserLists;

public record UserListDto(
    Guid Id,
    string Name,
    Guid UserId,
    string? Description,
    int TitlesCount,
    DateTime CreatedAt,
    IEnumerable<ReadingListTitleDto> Titles
);