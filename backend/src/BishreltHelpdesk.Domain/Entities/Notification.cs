namespace BishreltHelpdesk.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid RecipientId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Feedback";
    public bool IsRead { get; set; } = false;
    public Guid? RelatedTicketId { get; set; }

    public User Recipient { get; set; } = null!;
    public Ticket? RelatedTicket { get; set; }
}
