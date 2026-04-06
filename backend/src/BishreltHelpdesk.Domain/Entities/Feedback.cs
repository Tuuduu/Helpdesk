namespace BishreltHelpdesk.Domain.Entities;

public class Feedback : BaseEntity
{
    public Guid TicketId { get; set; }
    public Guid? SubmittedById { get; set; }
    public string? GuestName { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }

    // Navigation
    public Ticket Ticket { get; set; } = null!;
    public User? SubmittedBy { get; set; }
}
