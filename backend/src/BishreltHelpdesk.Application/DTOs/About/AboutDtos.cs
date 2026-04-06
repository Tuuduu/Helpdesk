namespace BishreltHelpdesk.Application.DTOs.About;

public class AboutResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string? UpdatedByName { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateAboutRequest
{
    public string Content { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
}
