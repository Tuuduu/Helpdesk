namespace BishreltHelpdesk.Domain.Entities;

public class ComputerImage
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }

    // Navigation
    public Computer Computer { get; set; } = null!;
}
