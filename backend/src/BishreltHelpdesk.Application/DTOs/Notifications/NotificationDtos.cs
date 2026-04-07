namespace BishreltHelpdesk.Application.DTOs.Notifications;

public class NotificationResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public Guid? RelatedTicketId { get; set; }
    public string? TicketNumber { get; set; }
    public DateTime CreatedAt { get; set; }
}
