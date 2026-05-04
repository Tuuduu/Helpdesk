using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class Computer : BaseEntity
{
    public string AssetCode { get; set; } = string.Empty;

    // Тип: Суурин (Desktop) эсвэл Зөөврийн (Laptop)
    public ComputerKind Kind { get; set; } = ComputerKind.Desktop;

    // Hardware
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? Monitor { get; set; }
    public string Cpu { get; set; } = string.Empty;
    public int RamGb { get; set; }
    public string? Gpu { get; set; }

    // Network / identity
    public string? DomainName { get; set; }

    // Ownership
    public Guid OwnerUserId { get; set; }
    public string Position { get; set; } = string.Empty;
    public string? Department { get; set; }
    public Guid CompanyId { get; set; }

    // Lifecycle
    public ComputerStatus Status { get; set; } = ComputerStatus.Active;

    // Navigation
    public User Owner { get; set; } = null!;
    public Company Company { get; set; } = null!;
    public ICollection<ComputerStorage> Storages { get; set; } = new List<ComputerStorage>();
    public ICollection<ComputerImage> Images { get; set; } = new List<ComputerImage>();
    public ICollection<ComputerAccessory> Accessories { get; set; } = new List<ComputerAccessory>();
    public ICollection<ComputerMacAddress> MacAddresses { get; set; } = new List<ComputerMacAddress>();
    public ICollection<ComputerTransferRequest> TransferRequests { get; set; } = new List<ComputerTransferRequest>();
    public ICollection<ComputerTransferHistory> TransferHistories { get; set; } = new List<ComputerTransferHistory>();
}
