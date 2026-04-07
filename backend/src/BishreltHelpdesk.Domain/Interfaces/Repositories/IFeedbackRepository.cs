using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface IFeedbackRepository : IRepository<Feedback>
{
    Task<List<Feedback>> GetByTicketAsync(Guid ticketId);
    Task<Feedback?> GetByTicketAndUserAsync(Guid ticketId, Guid userId);
    IQueryable<Feedback> QueryWithIncludes();
}
