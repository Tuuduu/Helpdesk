using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
        => await _dbSet.Include(u => u.Company).Include(u => u.Department).FirstOrDefaultAsync(u => u.Email == email);

    public async Task<List<User>> GetByCompanyAsync(Guid companyId)
        => await _dbSet.Where(u => u.CompanyId == companyId).ToListAsync();

    public async Task<List<User>> GetEngineersAsync()
        => await _dbSet
            .Where(u => u.Role == UserRole.Admin || u.Role == UserRole.SuperAdmin)
            .Where(u => u.IsActive)
            .OrderBy(u => u.FullName)
            .ToListAsync();

    public async Task<bool> EmailExistsAsync(string email)
        => await _dbSet.AnyAsync(u => u.Email == email);
}
