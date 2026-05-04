using BishreltHelpdesk.Application.DTOs.ComputerTransfers;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.DTOs.ComputerProcesses;

public class CreateProcessRequestRequest
{
    public Guid ComputerId { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class ProcessActionRequest
{
    public string? Note { get; set; }
}

public class ProcessRequestListItem
{
    public Guid Id { get; set; }
    public WorkflowType Type { get; set; }
    public Guid ComputerId { get; set; }
    public string AssetCode { get; set; } = string.Empty;
    public string ComputerLabel { get; set; } = string.Empty;
    public string RequestedByName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ProcessRequestResponse : ProcessRequestListItem
{
    public Guid RequestedByUserId { get; set; }
    public int CurrentStepIndex { get; set; }
    public List<WorkflowStepProgress> WorkflowSteps { get; set; } = new();
    public DateTime? CompletedAt { get; set; }
    public string? CompletionNote { get; set; }
}

public class ProcessHistoryItem
{
    public Guid Id { get; set; }
    public WorkflowType Type { get; set; }
    public Guid RequestId { get; set; }
    public string ActedByName { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
    public string? Description { get; set; }
    public string? Note { get; set; }
}
