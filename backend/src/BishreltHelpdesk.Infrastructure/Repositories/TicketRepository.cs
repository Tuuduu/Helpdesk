using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class TicketRepository : Repository<Ticket>, ITicketRepository
{
    public TicketRepository(AppDbContext context) : base(context) { }

    public async Task<Ticket?> GetWithDetailsAsync(Guid id)
    {
        return await _dbSet
            .Include(t => t.Company)
            .Include(t => t.RequestedBy)
            .Include(t => t.AssignedTo)
            .Include(t => t.ClosedBy)
            .Include(t => t.History.OrderBy(h => h.CreatedAt))
                .ThenInclude(h => h.PerformedBy)
            .Include(t => t.Feedbacks)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<string> GenerateTicketNumberAsync()
    {
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"HD-{today}-";

        var lastTicket = await _dbSet
            .Where(t => t.TicketNumber.StartsWith(prefix))
            .OrderByDescending(t => t.TicketNumber)
            .FirstOrDefaultAsync();

        var sequence = 1;
        if (lastTicket != null)
        {
            var lastPart = lastTicket.TicketNumber.Replace(prefix, "");
            if (int.TryParse(lastPart, out var num))
                sequence = num + 1;
        }

        return $"{prefix}{sequence:D3}";
    }

    public IQueryable<Ticket> QueryWithIncludes()
    {
        return _dbSet
            .Include(t => t.Company)
            .Include(t => t.AssignedTo)
            .AsQueryable();
    }

    public async Task<int> GetCountByStatusAsync(TicketStatus status, DateTime? from, DateTime? to)
    {
        var query = _dbSet.Where(t => t.Status == status);
        if (from.HasValue) query = query.Where(t => t.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(t => t.CreatedAt <= to.Value);
        return await query.CountAsync();
    }
}
