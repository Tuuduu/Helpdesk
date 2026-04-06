using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.DTOs.Reports;

public class ReportFilterRequest
{
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public Guid? EngineerId { get; set; }
    public Guid? CompanyId { get; set; }
    public TicketStatus? Status { get; set; }
}

public class ReportRow
{
    public string TicketNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string CallType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public double? ResolutionHours { get; set; }
}

public class ReportSummary
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ClosedTickets { get; set; }
    public double AvgResolutionHours { get; set; }
    public List<ReportRow> Rows { get; set; } = new();
}
