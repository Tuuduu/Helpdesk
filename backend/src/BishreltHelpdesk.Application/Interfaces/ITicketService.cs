using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Tickets;

namespace BishreltHelpdesk.Application.Interfaces;

public interface ITicketService
{
    Task<TicketResponse> CreateAsync(CreateTicketRequest request);
    Task<PublicTicketResponse> CreatePublicAsync(PublicTicketRequest request);
    Task<TicketResponse> GetByIdAsync(Guid id);
    Task<PagedResult<TicketListItem>> GetListAsync(TicketFilterRequest filter);
    Task<PagedResult<TicketListItem>> GetMyTicketsAsync(Guid userId, PagedRequest request);
    Task<TicketResponse> UpdateStatusAsync(Guid id, UpdateTicketStatusRequest request);
    Task<TicketResponse> AssignAsync(Guid id, AssignTicketRequest request);
    Task DeleteAsync(Guid id);
}
