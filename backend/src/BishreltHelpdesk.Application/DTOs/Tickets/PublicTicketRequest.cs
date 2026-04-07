namespace BishreltHelpdesk.Application.DTOs.Tickets;

/// <summary>
/// Нэвтрэлгүй хэрэглэгч (зочин) тикет үүсгэх хүсэлт
/// </summary>
public class PublicTicketRequest
{
    public string CallType { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? ComputerNumber { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class PublicTicketResponse
{
    public string TicketNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
