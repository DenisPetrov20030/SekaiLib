using SekaiLib.Application.DTOs.Titles;
using SekaiLib.Domain.Enums;

namespace SekaiLib.Application.Interfaces;

public interface ITitleCommentService
{
    Task<IEnumerable<TitleCommentResponse>> GetCommentsByTitleAsync(Guid titleId, Guid? currentUserId);
    Task<TitleCommentResponse> AddCommentAsync(Guid userId, Guid titleId, CreateTitleCommentRequest request);
    Task<TitleCommentResponse> UpdateCommentAsync(Guid userId, Guid commentId, UpdateTitleCommentRequest request);
    Task<TitleCommentResponse> SetCommentReactionAsync(Guid userId, Guid commentId, ReactionType type);
    Task RemoveCommentReactionAsync(Guid userId, Guid commentId);
    Task DeleteCommentAsync(Guid userId, Guid commentId, bool isAdmin);
}
