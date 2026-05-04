using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class TransferWorkflowStep : BaseEntity
{
    public Guid CompanyId { get; set; }
    public WorkflowType WorkflowType { get; set; } = WorkflowType.Transfer;
    public int Order { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation
    public Company Company { get; set; } = null!;
    public ICollection<TransferWorkflowStepApprover> Approvers { get; set; }
        = new List<TransferWorkflowStepApprover>();
}

public class TransferWorkflowStepApprover
{
    public Guid Id { get; set; }
    public Guid StepId { get; set; }
    public Guid UserId { get; set; }

    public TransferWorkflowStep Step { get; set; } = null!;
    public User User { get; set; } = null!;
}
