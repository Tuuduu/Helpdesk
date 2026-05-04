using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface IComputerTransferRequestRepository : IRepository<ComputerTransferRequest>
{
    Task<ComputerTransferRequest?> GetWithDetailsAsync(Guid id);
    IQueryable<ComputerTransferRequest> QueryWithIncludes();
}
