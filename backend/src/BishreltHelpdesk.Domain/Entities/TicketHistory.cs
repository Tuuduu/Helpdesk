using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class TicketHistory
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid PerformedById { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? FromValue { get; set; }
    public string? ToValue { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public User PerformedBy { get; set; } = null!;
}
