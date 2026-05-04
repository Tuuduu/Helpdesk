namespace BishreltHelpdesk.Application.DTOs.ComputerTransfers;

public class CreateTransferRequestRequest
{
    public Guid ComputerId { get; set; }
    public Guid ToUserId { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ApprovalActionRequest
{
    public string? Note { get; set; }
}

public class ReceiverActionRequest
{
    public string? Note { get; set; }
}

public class TransferRequestListItem
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string ComputerLabel { get; set; } = string.Empty;
    public string FromUserName { get; set; } = string.Empty;
    public string ToUserName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TransferRequestResponse : TransferRequestListItem
{
    public Guid FromUserId { get; set; }
    public Guid ToUserId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public string RequestedByName { get; set; } = string.Empty;
    public int CurrentStepIndex { get; set; }
    public List<WorkflowStepProgress> WorkflowSteps { get; set; } = new();
    public DateTime? ReceiverActionAt { get; set; }
    public string? ReceiverNote { get; set; }
}

public class WorkflowStepProgress
{
    public int Order { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<string> ApproverNames { get; set; } = new();
    public List<Guid> ApproverUserIds { get; set; } = new();
    public bool IsCompleted { get; set; }
    public bool IsCurrent { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Note { get; set; }
}

public class TransferStepActionLog
{
    public Guid Id { get; set; }
    public Guid TransferId { get; set; }
    public int StepOrder { get; set; }
    public Guid ActedByUserId { get; set; }
    public DateTime ActedAt { get; set; }
    public string? Note { get; set; }
}

public class TransferHistoryItem
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }
    public string? FromUserName { get; set; }
    public string ToUserName { get; set; } = string.Empty;
    public string ApprovedByStorekeeperName { get; set; } = string.Empty;
    public DateTime TransferredAt { get; set; }
    public string? Note { get; set; }
}
