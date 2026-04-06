namespace BishreltHelpdesk.Domain.Entities;

public class AboutContent : BaseEntity
{
    public string Content { get; set; } = string.Empty;
    public string Version { get; set; } = "1.0.0";
    public Guid? UpdatedById { get; set; }

    // Navigation
    public User? UpdatedBy { get; set; }
}
