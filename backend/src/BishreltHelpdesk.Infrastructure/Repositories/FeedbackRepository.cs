using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Repositories;

public class FeedbackRepository : Repository<Feedback>, IFeedbackRepository
{
    public FeedbackRepository(AppDbContext context) : base(context) { }

    public async Task<List<Feedback>> GetByTicketAsync(Guid ticketId)
    {
        return await _context.Feedbacks
            .Include(f => f.SubmittedBy)
            .Where(f => f.TicketId == ticketId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<Feedback?> GetByTicketAndUserAsync(Guid ticketId, Guid userId)
    {
        return await _context.Feedbacks
            .FirstOrDefaultAsync(f => f.TicketId == ticketId && f.SubmittedById == userId);
    }

    public IQueryable<Feedback> QueryWithIncludes()
    {
        return _context.Feedbacks
            .Include(f => f.Ticket)
            .Include(f => f.SubmittedBy)
            .AsQueryable();
    }
}
