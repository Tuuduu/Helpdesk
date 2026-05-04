using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface IComputerRepository : IRepository<Computer>
{
    Task<Computer?> GetWithDetailsAsync(Guid id);
    Task<string> GenerateAssetCodeAsync();
    IQueryable<Computer> QueryWithIncludes();
    Task<bool> AssetCodeExistsAsync(string assetCode);
    Task<bool> MacAddressInUseAsync(string macAddress, Guid? excludeComputerId = null);
}
