using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class ComputerRepository : Repository<Computer>, IComputerRepository
{
    public ComputerRepository(AppDbContext context) : base(context) { }

    public async Task<Computer?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Company)
            .Include(c => c.Storages)
            .Include(c => c.Images)
            .Include(c => c.MacAddresses)
            .Include(c => c.Accessories)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<string> GenerateAssetCodeAsync()
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"PC-{year}-";

        var lastCode = await _dbSet
            .Where(c => c.AssetCode.StartsWith(prefix))
            .OrderByDescending(c => c.AssetCode)
            .Select(c => c.AssetCode)
            .FirstOrDefaultAsync();

        var sequence = 1;
        if (lastCode != null)
        {
            var lastPart = lastCode.Substring(prefix.Length);
            if (int.TryParse(lastPart, out var num))
                sequence = num + 1;
        }

        return $"{prefix}{sequence:D4}";
    }

    public IQueryable<Computer> QueryWithIncludes()
    {
        return _dbSet
            .Include(c => c.Owner)
            .Include(c => c.Company)
            .Include(c => c.Storages)
            .Include(c => c.Images)
            .Include(c => c.MacAddresses)
            .AsQueryable();
    }

    public async Task<bool> AssetCodeExistsAsync(string assetCode)
    {
        return await _dbSet.AnyAsync(c => c.AssetCode == assetCode);
    }

    public async Task<bool> MacAddressInUseAsync(string macAddress, Guid? excludeComputerId = null)
    {
        var normalized = macAddress.ToUpper();
        var query = _context.ComputerMacAddresses
            .Where(m => m.Address.ToUpper() == normalized);
        if (excludeComputerId.HasValue)
            query = query.Where(m => m.ComputerId != excludeComputerId.Value);
        return await query.AnyAsync();
    }
}
