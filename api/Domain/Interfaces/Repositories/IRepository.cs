using System.Linq;
using System.Linq.Expressions;

namespace SekaiLib.Domain.Interfaces.Repositories;

public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task<bool> ExistsAsync(Guid id);
    Task<int> CountAsync(Expression<Func<T, bool>> predicate); 
}
