using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Domain.Interfaces.Repositories;

public interface IFeedbackRepository : IRepository<Feedback>
{
    Task<List<Feedback>> GetByTicketAsync(Guid ticketId);
    IQueryable<Feedback> QueryWithIncludes();
}
