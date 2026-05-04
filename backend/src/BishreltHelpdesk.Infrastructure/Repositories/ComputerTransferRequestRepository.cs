using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class ComputerTransferRequestRepository : Repository<ComputerTransferRequest>, IComputerTransferRequestRepository
{
    public ComputerTransferRequestRepository(AppDbContext context) : base(context) { }

    public async Task<ComputerTransferRequest?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(r => r.Computer)
            .Include(r => r.FromUser)
            .Include(r => r.ToUser)
            .Include(r => r.RequestedByUser)
            .Include(r => r.Storekeeper)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public IQueryable<ComputerTransferRequest> QueryWithIncludes()
    {
        return _dbSet
            .Include(r => r.Computer)
            .Include(r => r.FromUser)
            .Include(r => r.ToUser)
            .AsQueryable();
    }
}
