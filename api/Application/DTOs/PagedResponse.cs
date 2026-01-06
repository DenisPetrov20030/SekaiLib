namespace SekaiLib.Application.DTOs;

public record PagedResponse<T>(IEnumerable<T> Data, int TotalCount, int Page, int PageSize, int TotalPages);
