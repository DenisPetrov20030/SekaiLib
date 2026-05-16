using SekaiLib.Application.Common;
using SekaiLib.Application.DTOs.Collections;

namespace SekaiLib.Application.Interfaces;

public interface ICollectionService
{
    Task<PagedResult<CollectionDto>> GetAllAsync(string? search, int page, int pageSize);
    Task<IEnumerable<CollectionDto>> GetByUserAsync(Guid userId);
    Task<CollectionDetailsDto> GetByIdAsync(Guid id, Guid? viewerUserId, string? ipAddress = null);
    Task<CollectionDetailsDto> CreateAsync(Guid authorId, CreateCollectionRequest request);
    Task<CollectionDetailsDto> UpdateAsync(Guid userId, Guid id, UpdateCollectionRequest request);
    Task DeleteAsync(Guid userId, Guid id);
    Task<CollectionSectionDto> AddSectionAsync(Guid userId, Guid collectionId, AddSectionRequest request);
    Task UpdateSectionAsync(Guid userId, Guid collectionId, Guid sectionId, string name);
    Task DeleteSectionAsync(Guid userId, Guid collectionId, Guid sectionId);
    Task<CollectionItemDto> AddItemAsync(Guid userId, Guid collectionId, AddCollectionItemRequest request);
    Task RemoveItemAsync(Guid userId, Guid collectionId, Guid itemId);
    Task ReactAsync(Guid userId, Guid collectionId, bool isLike);
    Task RemoveReactionAsync(Guid userId, Guid collectionId);
}

public interface ICollectionCommentService
{
    Task<IEnumerable<CollectionCommentDto>> GetByCollectionAsync(Guid collectionId);
    Task<IEnumerable<CollectionCommentDto>> GetRepliesAsync(Guid commentId);
    Task<CollectionCommentDto> CreateAsync(Guid authorId, Guid collectionId, CreateCollectionCommentRequest request);
    Task DeleteAsync(Guid userId, Guid commentId, bool isAdmin);
}
