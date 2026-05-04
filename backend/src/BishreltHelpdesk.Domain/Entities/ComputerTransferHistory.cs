namespace BishreltHelpdesk.Domain.Entities;

public class ComputerTransferHistory
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public Guid? FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public DateTime TransferredAt { get; set; }
    public Guid ApprovedByStorekeeperId { get; set; }
    public Guid RequestId { get; set; }
    public string? Note { get; set; }

    // Navigation
    public Computer Computer { get; set; } = null!;
    public User? FromUser { get; set; }
    public User ToUser { get; set; } = null!;
    public User ApprovedByStorekeeper { get; set; } = null!;
    public ComputerTransferRequest Request { get; set; } = null!;
}
