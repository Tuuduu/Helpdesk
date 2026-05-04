using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class ComputerTransferRequest : BaseEntity
{
    public Guid ComputerId { get; set; }
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public Guid RequestedByUserId { get; set; }

    public TransferRequestStatus Status { get; set; } = TransferRequestStatus.PendingApproval;

    /// <summary>
    /// Аль алхамд явж буй workflow дотор. -1 = алхам байхгүй (шууд PendingReceiver-т очсон).
    /// </summary>
    public int CurrentStepIndex { get; set; } = 0;

    // Storekeeper action (legacy — backward compat-д үлдээсэн)
    public Guid? StorekeeperId { get; set; }
    public DateTime? StorekeeperActionAt { get; set; }
    public string? StorekeeperNote { get; set; }

    // Receiver action
    public DateTime? ReceiverActionAt { get; set; }
    public string? ReceiverNote { get; set; }

    public string Reason { get; set; } = string.Empty;

    // Navigation
    public Computer Computer { get; set; } = null!;
    public User FromUser { get; set; } = null!;
    public User ToUser { get; set; } = null!;
    public User RequestedByUser { get; set; } = null!;
    public User? Storekeeper { get; set; }
    public ICollection<TransferStepApproval> StepApprovals { get; set; } = new List<TransferStepApproval>();
}
