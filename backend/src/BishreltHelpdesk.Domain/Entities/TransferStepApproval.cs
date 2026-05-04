namespace BishreltHelpdesk.Domain.Entities;

public class TransferStepApproval
{
    public Guid Id { get; set; }
    public Guid TransferId { get; set; }
    public int StepOrder { get; set; }
    public Guid ApprovedByUserId { get; set; }
    public DateTime ApprovedAt { get; set; }
    public string? Note { get; set; }

    public ComputerTransferRequest Transfer { get; set; } = null!;
    public User ApprovedByUser { get; set; } = null!;
}
