using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Application.Interfaces;
using SekaiLib.Application.Exceptions;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class ChapterService : IChapterService
{
    private readonly IUnitOfWork _unitOfWork;

    public ChapterService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<ChapterDto>> GetChaptersByTitleAsync(Guid titleId)
    {
        var titleExists = await _unitOfWork.Titles.ExistsAsync(titleId);
        if (!titleExists)
            throw new NotFoundException("Title", titleId);

        var chapters = await _unitOfWork.Chapters.GetByTitleIdAsync(titleId);

        return chapters
            .OrderBy(c => c.Number)
            .Select(c => new ChapterDto(c.Id, c.Number, c.Name, c.PublishedAt, c.IsPremium));
    }

    public async Task<ChapterContentDto> GetChapterContentAsync(Guid chapterId)
    {
        var chapter = await _unitOfWork.Chapters.GetByIdAsync(chapterId);
        if (chapter == null)
            throw new NotFoundException("Chapter", chapterId);

        return await BuildChapterContentDto(chapter);
    }

    public async Task<ChapterContentDto> GetChapterContentByNumberAsync(Guid titleId, int chapterNumber)
    {
        var chapter = await _unitOfWork.Chapters.GetByTitleAndNumberAsync(titleId, chapterNumber);
        if (chapter == null)
            throw new NotFoundException($"Chapter number {chapterNumber} for Title {titleId} was not found");

        return await BuildChapterContentDto(chapter);
    }

    private async Task<ChapterContentDto> BuildChapterContentDto(Domain.Entities.Chapter chapter)
    {
        var title = await _unitOfWork.Titles.GetByIdAsync(chapter.TitleId);
        if (title == null)
            throw new NotFoundException("Title", chapter.TitleId);

        var allChapters = (await _unitOfWork.Chapters.GetByTitleIdAsync(chapter.TitleId))
            .OrderBy(c => c.Number)
            .ToList();

        var currentIndex = allChapters.FindIndex(c => c.Number == chapter.Number);
        int? previousChapterNumber = currentIndex > 0 ? allChapters[currentIndex - 1].Number : null;
        int? nextChapterNumber = currentIndex < allChapters.Count - 1 ? allChapters[currentIndex + 1].Number : null;

        return new ChapterContentDto(
            chapter.Id,
            chapter.Number,
            chapter.Name,
            chapter.Content,
            chapter.PublishedAt,
            title.Id,
            title.Name,
            previousChapterNumber,
            nextChapterNumber
        );
    }
}
