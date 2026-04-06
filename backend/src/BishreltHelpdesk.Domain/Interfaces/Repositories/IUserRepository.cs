using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<List<User>> GetByCompanyAsync(Guid companyId);
    Task<List<User>> GetEngineersAsync();
    Task<bool> EmailExistsAsync(string email);
}
