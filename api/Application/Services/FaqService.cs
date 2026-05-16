using Microsoft.EntityFrameworkCore;
using SekaiLib.Application.DTOs.Faq;
using SekaiLib.Application.Exceptions;
using SekaiLib.Application.Interfaces;
using SekaiLib.Domain.Entities;
using SekaiLib.Domain.Interfaces;

namespace SekaiLib.Application.Services;

public class FaqService : IFaqService
{
    private readonly IUnitOfWork _unitOfWork;

    public FaqService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<FaqItemDto>> GetPublishedAsync()
    {
        var items = await _unitOfWork.FaqItems.Query()
            .Where(f => f.IsPublished)
            .OrderBy(f => f.Order)
            .ToListAsync();

        return items.Select(MapToDto);
    }

    public async Task<IEnumerable<FaqItemDto>> GetAllAsync()
    {
        var items = await _unitOfWork.FaqItems.Query()
            .OrderBy(f => f.Order)
            .ToListAsync();

        return items.Select(MapToDto);
    }

    public async Task<FaqItemDto> CreateAsync(CreateFaqItemRequest request)
    {
        var item = new FaqItem
        {
            Id = Guid.NewGuid(),
            Question = request.Question,
            Answer = request.Answer,
            Order = request.Order,
            IsPublished = request.IsPublished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.FaqItems.AddAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(item);
    }

    public async Task<FaqItemDto> UpdateAsync(Guid id, UpdateFaqItemRequest request)
    {
        var item = await _unitOfWork.FaqItems.GetByIdAsync(id)
            ?? throw new NotFoundException("FaqItem", id);

        item.Question = request.Question;
        item.Answer = request.Answer;
        item.Order = request.Order;
        item.IsPublished = request.IsPublished;
        item.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.FaqItems.UpdateAsync(item);
        await _unitOfWork.SaveChangesAsync();

        return MapToDto(item);
    }

    public async Task DeleteAsync(Guid id)
    {
        var item = await _unitOfWork.FaqItems.GetByIdAsync(id)
            ?? throw new NotFoundException("FaqItem", id);

        await _unitOfWork.FaqItems.DeleteAsync(item);
        await _unitOfWork.SaveChangesAsync();
    }

    private static FaqItemDto MapToDto(FaqItem f) => new()
    {
        Id = f.Id,
        Question = f.Question,
        Answer = f.Answer,
        Order = f.Order,
        IsPublished = f.IsPublished,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };
}
