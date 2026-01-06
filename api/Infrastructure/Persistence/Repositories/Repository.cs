using Microsoft.EntityFrameworkCore;
using SekaiLib.Domain.Interfaces.Repositories;

namespace SekaiLib.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly AppDbContext Context;
    protected readonly DbSet<T> DbSet;

    public Repository(AppDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id)
    {
        return await DbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
        return await DbSet.ToListAsync();
    }

    public virtual async Task<T> AddAsync(T entity)
    {
        await DbSet.AddAsync(entity);
        return entity;
    }

    public virtual async Task UpdateAsync(T entity)
    {
        DbSet.Update(entity);
        await Task.CompletedTask;
    }

    public virtual async Task DeleteAsync(T entity)
    {
        DbSet.Remove(entity);
        await Task.CompletedTask;
    }

    public virtual void Remove(T entity)
    {
        DbSet.Remove(entity);
    }

    public virtual async Task<bool> ExistsAsync(Guid id)
    {
        return await DbSet.FindAsync(id) != null;
    }
}
