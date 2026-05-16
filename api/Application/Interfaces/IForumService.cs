using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Forum;

namespace SekaiLib.Application.Interfaces;

public interface IForumService
{
    // Categories
    Task<IEnumerable<ForumCategoryDto>> GetCategoriesAsync();
    Task<ForumCategoryDto> CreateCategoryAsync(Guid adminId, CreateCategoryRequest request);
    Task<ForumCategoryDto> UpdateCategoryAsync(Guid adminId, Guid categoryId, UpdateCategoryRequest request);
    Task DeleteCategoryAsync(Guid adminId, Guid categoryId);

    // Threads
    Task<PagedResult<ForumThreadDto>> GetThreadsAsync(Guid categoryId, int page, int pageSize);
    Task<PagedResult<ForumThreadDto>> SearchThreadsAsync(string query, int page, int pageSize);
    Task<ForumThreadDetailsDto> GetThreadAsync(Guid threadId, Guid? userId, string? ipAddress = null);
    Task<ForumThreadDetailsDto> CreateThreadAsync(Guid userId, CreateThreadRequest request);
    Task DeleteThreadAsync(Guid userId, Guid threadId);
    Task PinThreadAsync(Guid adminId, Guid threadId, bool pinned);
    Task LockThreadAsync(Guid adminId, Guid threadId, bool locked);

    // Posts
    Task<PagedResult<ForumPostDto>> GetPostsAsync(Guid threadId, Guid? userId, int page, int pageSize);
    Task<ForumPostDto> CreatePostAsync(Guid userId, Guid threadId, CreatePostRequest request);
    Task<ForumPostDto> UpdatePostAsync(Guid userId, Guid postId, UpdatePostRequest request);
    Task DeletePostAsync(Guid userId, Guid postId);
    Task<ForumPostDto> ReactAsync(Guid userId, Guid postId, bool isLike);
    Task<ForumPostDto> RemoveReactionAsync(Guid userId, Guid postId);
}
