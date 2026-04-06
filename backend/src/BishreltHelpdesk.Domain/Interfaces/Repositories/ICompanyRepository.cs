using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface ICompanyRepository : IRepository<Company>
{
    Task<Company?> GetByNameAsync(string name);
    Task<List<Company>> GetActiveCompaniesAsync();
}
