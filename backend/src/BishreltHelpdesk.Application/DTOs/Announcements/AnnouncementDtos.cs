namespace BishreltHelpdesk.Application.DTOs.Announcements;

public class AnnouncementResponse
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Level { get; set; } = "info";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Level { get; set; } = "info";
    public int SortOrder { get; set; }
}

public class UpdateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Level { get; set; } = "info";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
