using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface IRepository<T> where T : BaseEntity
{
    Task<T?> GetByIdAsync(Guid id);
    Task<List<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    void Update(T entity);
    void Delete(T entity);
    IQueryable<T> Query();
}
