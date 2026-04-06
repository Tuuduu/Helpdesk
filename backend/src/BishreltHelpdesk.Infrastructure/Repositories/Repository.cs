using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id) => await _dbSet.FindAsync(id);

    public async Task<List<T>> GetAllAsync() => await _dbSet.ToListAsync();

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public void Update(T entity) => _dbSet.Update(entity);

    public void Delete(T entity) => _dbSet.Remove(entity);

    public IQueryable<T> Query() => _dbSet.AsQueryable();
}
