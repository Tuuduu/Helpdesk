using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class ComputerMacAddress
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public MacAddressType Type { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Label { get; set; }
    public bool IsPrimary { get; set; }

    // Navigation
    public Computer Computer { get; set; } = null!;
}
