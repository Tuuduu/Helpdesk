using BishreltHelpdesk.Application.DTOs.TransferWorkflows;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.Interfaces;

public interface ITransferWorkflowService
{
    Task<List<TransferWorkflowStepDto>> GetByCompanyAsync(Guid companyId, WorkflowType type);
    Task<List<TransferWorkflowStepDto>> SaveAsync(SaveWorkflowRequest request);

    /// <summary>
    /// Тухайн компани, төрлийн workflow дэх алхмуудыг буцаана.
    /// </summary>
    Task<List<TransferWorkflowStep>> LoadStepsForCompanyAsync(Guid companyId, WorkflowType type);
}
