using BishreltHelpdesk.Application.DTOs.Common;

namespace BishreltHelpdesk.Application.DTOs.Feedback;

public class CreateFeedbackRequest
{
    public Guid TicketId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public string? GuestName { get; set; }
}

public class FeedbackResponse
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string TicketNumber { get; set; } = string.Empty;
    public string TicketTitle { get; set; } = string.Empty;
    public string? SubmittedByName { get; set; }
    public string? GuestName { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FeedbackFilterRequest : PagedRequest
{
    public string? Search { get; set; }
    public int? Rating { get; set; }
}
