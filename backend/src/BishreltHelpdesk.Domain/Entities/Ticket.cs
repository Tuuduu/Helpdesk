using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class Ticket : BaseEntity
{
    public string TicketNumber { get; set; } = string.Empty;
    public string CallType { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }

    // Requester info (snapshot at creation)
    public bool IsGuest { get; set; }
    public Guid? RequestedById { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? Department { get; set; }
    public string? ComputerNumber { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;

    // Ticket content
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    // Workflow
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public Guid? AssignedToId { get; set; }
    public Guid? ClosedById { get; set; }
    public DateTime? ClosedAt { get; set; }

    // Navigation
    public Company Company { get; set; } = null!;
    public User? RequestedBy { get; set; }
    public User? AssignedTo { get; set; }
    public User? ClosedBy { get; set; }
    public ICollection<TicketHistory> History { get; set; } = new List<TicketHistory>();
    public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
}
