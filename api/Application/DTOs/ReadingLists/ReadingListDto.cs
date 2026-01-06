using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.ReadingLists;

public record ReadingListDto(Guid TitleId, string TitleName, ReadingStatus Status, DateTime AddedAt);
