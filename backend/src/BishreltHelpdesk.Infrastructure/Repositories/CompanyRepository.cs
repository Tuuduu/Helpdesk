using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class CompanyRepository : Repository<Company>, ICompanyRepository
{
    public CompanyRepository(AppDbContext context) : base(context) { }

    public async Task<Company?> GetByNameAsync(string name)
    {
        return await _context.Companies
            .FirstOrDefaultAsync(c => c.Name == name);
    }

    public async Task<List<Company>> GetActiveCompaniesAsync()
    {
        return await _context.Companies
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();
    }
}
