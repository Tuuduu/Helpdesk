using BishreltHelpdesk.Application.DTOs.ComputerProcesses;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.Interfaces;

/// <summary>
/// Засвар (Repair) болон Акт хасагдалт (Retirement) хоёр төрлийн хүсэлтийг ижил
/// логикоор гүйцэтгэдэг service. Type параметрээр ялгана.
/// </summary>
public interface IComputerProcessService
{
    Task<ProcessRequestResponse> GetByIdAsync(Guid id);
    Task<ProcessRequestResponse> CreateAsync(WorkflowType type, CreateProcessRequestRequest request);
    Task<ProcessRequestResponse> ApproveCurrentStepAsync(Guid id, ProcessActionRequest request);
    Task<ProcessRequestResponse> RejectCurrentStepAsync(Guid id, ProcessActionRequest request);
    Task<List<ProcessRequestListItem>> GetMyPendingApprovalsAsync(WorkflowType type);
    Task<List<ProcessRequestListItem>> GetByComputerAsync(Guid computerId, WorkflowType? type = null);
    Task<List<ProcessHistoryItem>> GetHistoryAsync(Guid computerId, WorkflowType? type = null);
}
