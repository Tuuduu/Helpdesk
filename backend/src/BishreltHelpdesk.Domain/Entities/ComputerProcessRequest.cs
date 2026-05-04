using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

/// <summary>
/// Засварын болон Акт хасагдалтын хүсэлт. Хоёулаа адил workflow logic-той тул
/// Type талбараар ялгана.
/// </summary>
public class ComputerProcessRequest : BaseEntity
{
    public WorkflowType Type { get; set; }
    public Guid ComputerId { get; set; }
    public Guid RequestedByUserId { get; set; }
    public string Description { get; set; } = string.Empty;

    public ProcessRequestStatus Status { get; set; } = ProcessRequestStatus.PendingApproval;
    public int CurrentStepIndex { get; set; } = 0;

    public DateTime? CompletedAt { get; set; }
    public string? CompletionNote { get; set; }

    // Navigation
    public Computer Computer { get; set; } = null!;
    public User RequestedByUser { get; set; } = null!;
    public ICollection<ProcessStepApproval> StepApprovals { get; set; }
        = new List<ProcessStepApproval>();
}

/// <summary>Алхам бүрийн зөвшөөрөл / татгалзал бичлэг.</summary>
public class ProcessStepApproval
{
    public Guid Id { get; set; }
    public Guid ProcessRequestId { get; set; }
    public int StepOrder { get; set; }
    public Guid ActedByUserId { get; set; }
    public DateTime ActedAt { get; set; }
    public bool IsApproval { get; set; }   // false = татгалзсан
    public string? Note { get; set; }

    public ComputerProcessRequest ProcessRequest { get; set; } = null!;
    public User ActedByUser { get; set; } = null!;
}

/// <summary>
/// Засварын / Акт хасагдалтын дууссан түүх (append-only).
/// Computer detail-ийн "Бүх түүх" view-д харуулна.
/// </summary>
public class ComputerProcessHistory
{
    public Guid Id { get; set; }
    public Guid ComputerId { get; set; }
    public WorkflowType Type { get; set; }
    public Guid RequestId { get; set; }
    public Guid ActedByUserId { get; set; }
    public DateTime CompletedAt { get; set; }
    public string? Description { get; set; }
    public string? Note { get; set; }

    public Computer Computer { get; set; } = null!;
    public User ActedByUser { get; set; } = null!;
    public ComputerProcessRequest Request { get; set; } = null!;
}
