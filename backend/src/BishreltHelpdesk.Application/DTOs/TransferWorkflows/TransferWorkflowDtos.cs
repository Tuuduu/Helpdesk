namespace BishreltHelpdesk.Application.DTOs.TransferWorkflows;

public class TransferWorkflowStepDto
{
    public Guid Id { get; set; }
    public int Order { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<WorkflowApproverDto> Approvers { get; set; } = new();
}

public class WorkflowApproverDto
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Position { get; set; }
}

public class WorkflowStepInput
{
    public string Name { get; set; } = string.Empty;
    public List<Guid> ApproverUserIds { get; set; } = new();
}

public class SaveWorkflowRequest
{
    public Guid CompanyId { get; set; }
    public BishreltHelpdesk.Domain.Enums.WorkflowType WorkflowType { get; set; }
        = BishreltHelpdesk.Domain.Enums.WorkflowType.Transfer;
    public List<WorkflowStepInput> Steps { get; set; } = new();
}
