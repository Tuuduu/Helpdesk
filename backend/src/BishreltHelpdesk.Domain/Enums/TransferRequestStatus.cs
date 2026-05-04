namespace BishreltHelpdesk.Domain.Enums;

public enum TransferRequestStatus
{
    PendingApproval = 0,   // Workflow дунд алхмын зөвшөөрөл хүлээж буй
    PendingReceiver = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4
}
