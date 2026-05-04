using BishreltHelpdesk.Application.DTOs.ComputerTransfers;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IComputerTransferService
{
    Task<TransferRequestResponse> GetByIdAsync(Guid id);
    Task<TransferRequestResponse> CreateAsync(CreateTransferRequestRequest request);

    /// <summary>
    /// Workflow-ын одоогийн алхмын батлагч (тухайн нэвтэрсэн хэрэглэгч)-аас зөвшөөрөл өгөх.
    /// Хэрэв энэ нь сүүлчийн алхам бол status = PendingReceiver рүү шилжинэ.
    /// </summary>
    Task<TransferRequestResponse> ApproveCurrentStepAsync(Guid id, ApprovalActionRequest request);
    Task<TransferRequestResponse> RejectCurrentStepAsync(Guid id, ApprovalActionRequest request);

    Task<TransferRequestResponse> ApproveByReceiverAsync(Guid id, ReceiverActionRequest request);
    Task<TransferRequestResponse> RejectByReceiverAsync(Guid id, ReceiverActionRequest request);

    /// <summary>
    /// Тухайн user-ыг батлагчаар тохируулсан шилжүүлгүүд (workflow-ын одоогийн алхамд).
    /// </summary>
    Task<List<TransferRequestListItem>> GetMyPendingApprovalsAsync();
    Task<List<TransferRequestListItem>> GetPendingForReceiverAsync();
    Task<List<TransferHistoryItem>> GetHistoryAsync(Guid computerId);
}
