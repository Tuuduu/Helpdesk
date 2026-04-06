using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.DTOs.Tickets;

public class CreateTicketRequest
{
    public CallType CallType { get; set; }
    public Guid CompanyId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? ComputerNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsGuest { get; set; }
}

public class UpdateTicketStatusRequest
{
    public TicketStatus NewStatus { get; set; }
    public string? Note { get; set; }
}

public class AssignTicketRequest
{
    public Guid AssignToId { get; set; }
}

public class TicketListItem
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? AssignedToName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TicketResponse : TicketListItem
{
    public string CallType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? ComputerNumber { get; set; }
    public bool IsGuest { get; set; }
    public string? ClosedByName { get; set; }
    public DateTime? ClosedAt { get; set; }
    public List<TicketHistoryItem> History { get; set; } = new();
}

public class TicketHistoryItem
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? FromValue { get; set; }
    public string? ToValue { get; set; }
    public string PerformedByName { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TicketFilterRequest : PagedRequest
{
    public TicketStatus? Status { get; set; }
    public Guid? CompanyId { get; set; }
    public Guid? AssignedToId { get; set; }
    public string? Search { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
}
