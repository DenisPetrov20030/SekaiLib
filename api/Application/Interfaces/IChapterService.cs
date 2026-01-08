using SekaiLib.Application.DTOs.Chapters;

namespace SekaiLib.Application.Interfaces;

public interface IChapterService
{
    Task<IEnumerable<ChapterDto>> GetChaptersByTitleAsync(Guid titleId);
    Task<ChapterContentDto> GetChapterContentAsync(Guid chapterId);
    Task<ChapterContentDto> GetChapterContentByNumberAsync(Guid titleId, int chapterNumber);
    Task<ChapterContentDto> CreateAsync(Guid userId, Guid titleId, CreateChapterRequest request);
    Task<ChapterContentDto> UpdateAsync(Guid userId, Guid chapterId, UpdateChapterRequest request);
    Task DeleteAsync(Guid userId, Guid chapterId);
}
