using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.TransferWorkflows;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/transfer-workflows")]
[Authorize]
public class TransferWorkflowsController : ControllerBase
{
    private readonly ITransferWorkflowService _service;

    public TransferWorkflowsController(ITransferWorkflowService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get(
        [FromQuery] Guid companyId,
        [FromQuery] WorkflowType type = WorkflowType.Transfer)
    {
        var result = await _service.GetByCompanyAsync(companyId, type);
        return Ok(ApiResponse<List<TransferWorkflowStepDto>>.Ok(result));
    }

    [HttpPut]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Save([FromBody] SaveWorkflowRequest request)
    {
        var result = await _service.SaveAsync(request);
        return Ok(ApiResponse<List<TransferWorkflowStepDto>>.Ok(result, "Workflow хадгалагдлаа"));
    }
}
