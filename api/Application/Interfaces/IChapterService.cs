using SekaiLib.Application.DTOs.Chapters;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Interfaces;

public interface IChapterService
{
    Task<IEnumerable<ChapterDto>> GetChaptersByTitleAsync(Guid titleId);
    Task<ChapterContentDto> GetChapterContentAsync(Guid chapterId);
    Task<ChapterContentDto> GetChapterContentByNumberAsync(Guid titleId, int chapterNumber);
    Task<ChapterContentDto> CreateAsync(Guid userId, Guid titleId, CreateChapterRequest request);
    Task<ChapterContentDto> UpdateAsync(Guid userId, Guid chapterId, UpdateChapterRequest request);
    Task<IEnumerable<LatestChapterDto>> GetLatestChaptersAsync(int count);
    Task DeleteAsync(Guid userId, Guid chapterId);

    // Comments
    Task<IEnumerable<ChapterCommentResponse>> GetCommentsAsync(Guid chapterId, Guid? currentUserId);
    Task<ChapterCommentResponse> AddCommentAsync(Guid userId, Guid chapterId, CreateChapterCommentRequest request);
    Task<ChapterCommentResponse> UpdateCommentAsync(Guid userId, Guid commentId, UpdateChapterCommentRequest request);
    Task<ChapterCommentResponse> SetCommentReactionAsync(Guid userId, Guid commentId, ReactionType type);
    Task RemoveCommentReactionAsync(Guid userId, Guid commentId);
    Task DeleteCommentAsync(Guid userId, Guid commentId);
}
