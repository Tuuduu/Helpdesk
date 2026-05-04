using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.ComputerTransfers;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/computer-transfers")]
[Authorize]
public class ComputerTransfersController : ControllerBase
{
    private readonly IComputerTransferService _transferService;

    public ComputerTransfersController(IComputerTransferService transferService)
    {
        _transferService = transferService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransferRequestRequest request)
    {
        var result = await _transferService.CreateAsync(request);
        return Ok(ApiResponse<TransferRequestResponse>.Ok(result, "Шилжүүлгийн хүсэлт илгээгдлээ"));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _transferService.GetByIdAsync(id);
        return Ok(ApiResponse<TransferRequestResponse>.Ok(result));
    }

    [HttpGet("pending-my-approval")]
    public async Task<IActionResult> GetPendingForMe()
    {
        var result = await _transferService.GetMyPendingApprovalsAsync();
        return Ok(ApiResponse<List<TransferRequestListItem>>.Ok(result));
    }

    [HttpPost("{id:guid}/approve-step")]
    public async Task<IActionResult> ApproveStep(Guid id, [FromBody] ApprovalActionRequest request)
    {
        var result = await _transferService.ApproveCurrentStepAsync(id, request);
        return Ok(ApiResponse<TransferRequestResponse>.Ok(result, "Зөвшөөрөгдлөө"));
    }

    [HttpPost("{id:guid}/reject-step")]
    public async Task<IActionResult> RejectStep(Guid id, [FromBody] ApprovalActionRequest request)
    {
        var result = await _transferService.RejectCurrentStepAsync(id, request);
        return Ok(ApiResponse<TransferRequestResponse>.Ok(result, "Татгалзлаа"));
    }

    [HttpGet("pending-receiver")]
    public async Task<IActionResult> GetPendingForReceiver()
    {
        var result = await _transferService.GetPendingForReceiverAsync();
        return Ok(ApiResponse<List<TransferRequestListItem>>.Ok(result));
    }

    [HttpPost("{id:guid}/approve-receiver")]
    public async Task<IActionResult> ApproveByReceiver(Guid id, [FromBody] ReceiverActionRequest request)
    {
        var result = await _transferService.ApproveByReceiverAsync(id, request);
        return Ok(ApiResponse<TransferRequestResponse>.Ok(result, "Хүлээн авлаа"));
    }

    [HttpPost("{id:guid}/reject-receiver")]
    public async Task<IActionResult> RejectByReceiver(Guid id, [FromBody] ReceiverActionRequest request)
    {
        var result = await _transferService.RejectByReceiverAsync(id, request);
        return Ok(ApiResponse<TransferRequestResponse>.Ok(result, "Татгалзлаа"));
    }
}
