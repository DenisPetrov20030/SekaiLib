using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.DTOs.ReadingLists;

public record UpdateReadingStatusRequest(Guid TitleId, ReadingStatus Status);
