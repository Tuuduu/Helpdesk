namespace BishreltHelpdesk.Domain.Entities;

public class ComputerAccessory
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Note { get; set; }

    // Navigation
    public Computer Computer { get; set; } = null!;
}
