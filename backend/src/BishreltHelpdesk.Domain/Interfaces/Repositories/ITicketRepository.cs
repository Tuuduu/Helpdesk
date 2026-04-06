using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface ITicketRepository : IRepository<Ticket>
{
    Task<Ticket?> GetWithDetailsAsync(Guid id);
    Task<string> GenerateTicketNumberAsync();
    IQueryable<Ticket> QueryWithIncludes();
    Task<int> GetCountByStatusAsync(TicketStatus status, DateTime? from, DateTime? to);
}
