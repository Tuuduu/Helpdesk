using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.ComputerProcesses;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/computer-retirements")]
[Authorize]
public class ComputerRetirementsController : ControllerBase
{
    private readonly IComputerProcessService _service;

    public ComputerRetirementsController(IComputerProcessService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProcessRequestRequest request)
    {
        var result = await _service.CreateAsync(WorkflowType.Retirement, request);
        return Ok(ApiResponse<ProcessRequestResponse>.Ok(result, "Акт хасагдалтын хүсэлт илгээгдлээ"));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return Ok(ApiResponse<ProcessRequestResponse>.Ok(result));
    }

    [HttpGet("pending-my-approval")]
    public async Task<IActionResult> GetPendingForMe()
    {
        var result = await _service.GetMyPendingApprovalsAsync(WorkflowType.Retirement);
        return Ok(ApiResponse<List<ProcessRequestListItem>>.Ok(result));
    }

    [HttpPost("{id:guid}/approve-step")]
    public async Task<IActionResult> ApproveStep(Guid id, [FromBody] ProcessActionRequest request)
    {
        var result = await _service.ApproveCurrentStepAsync(id, request);
        return Ok(ApiResponse<ProcessRequestResponse>.Ok(result, "Зөвшөөрөгдлөө"));
    }

    [HttpPost("{id:guid}/reject-step")]
    public async Task<IActionResult> RejectStep(Guid id, [FromBody] ProcessActionRequest request)
    {
        var result = await _service.RejectCurrentStepAsync(id, request);
        return Ok(ApiResponse<ProcessRequestResponse>.Ok(result, "Татгалзлаа"));
    }
}
