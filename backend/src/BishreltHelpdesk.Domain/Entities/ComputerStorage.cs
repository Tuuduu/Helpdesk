using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class ComputerStorage
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public StorageType Type { get; set; }
    public int CapacityGb { get; set; }
    public string? ModelName { get; set; }

    // Navigation
    public Computer Computer { get; set; } = null!;
}
