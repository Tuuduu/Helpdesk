using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Computers;
using BishreltHelpdesk.Application.DTOs.ComputerProcesses;
using BishreltHelpdesk.Application.DTOs.ComputerTransfers;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/computers")]
[Authorize]
public class ComputersController : ControllerBase
{
    private const long MaxImageUploadBytes = 5 * 1024 * 1024;

    private readonly IComputerService _computerService;
    private readonly IComputerTransferService _transferService;
    private readonly IComputerProcessService _processService;

    public ComputersController(
        IComputerService computerService,
        IComputerTransferService transferService,
        IComputerProcessService processService)
    {
        _computerService = computerService;
        _transferService = transferService;
        _processService = processService;
    }

    [HttpGet]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetList([FromQuery] ComputerFilterRequest filter)
    {
        var result = await _computerService.GetListAsync(filter);
        return Ok(ApiResponse<PagedResult<ComputerListItem>>.Ok(result));
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMine()
    {
        var result = await _computerService.GetMyComputersAsync();
        return Ok(ApiResponse<List<ComputerListItem>>.Ok(result));
    }

    [HttpGet("dashboard")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await _computerService.GetDashboardAsync();
        return Ok(ApiResponse<ComputerDashboardResponse>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _computerService.GetByIdAsync(id);
        return Ok(ApiResponse<ComputerResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateComputerRequest request)
    {
        var result = await _computerService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<ComputerResponse>.Ok(result, "Компьютер амжилттай бүртгэгдлээ"));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateComputerRequest request)
    {
        var result = await _computerService.UpdateAsync(id, request);
        return Ok(ApiResponse<ComputerResponse>.Ok(result, "Шинэчиллээ"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _computerService.DeleteAsync(id);
        return Ok(ApiResponse.Ok("Компьютер устгагдлаа"));
    }

    [HttpPost("{id:guid}/images")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    [RequestSizeLimit(MaxImageUploadBytes)]
    public async Task<IActionResult> UploadImage(Guid id, [FromForm] IFormFile file, [FromForm] bool isPrimary = false)
    {
        if (file == null || file.Length == 0)
            return BadRequest(ApiResponse.Fail("Файл оруулна уу"));

        await using var stream = file.OpenReadStream();
        var input = new UploadFileInput(stream, file.FileName, file.ContentType, file.Length);

        var result = await _computerService.UploadImageAsync(id, input, isPrimary);
        return Ok(ApiResponse<ComputerImageDto>.Ok(result, "Зураг хадгалагдлаа"));
    }

    [HttpDelete("{id:guid}/images/{imageId:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> DeleteImage(Guid id, Guid imageId)
    {
        await _computerService.DeleteImageAsync(id, imageId);
        return Ok(ApiResponse.Ok("Зураг устгагдлаа"));
    }

    [HttpGet("{id:guid}/transfer-history")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetTransferHistory(Guid id)
    {
        var result = await _transferService.GetHistoryAsync(id);
        return Ok(ApiResponse<List<TransferHistoryItem>>.Ok(result));
    }

    /// <summary>
    /// Тухайн компьютер дээрх бүх Засвар + Актын хүсэлтүүд (status болгоноор).
    /// Бөглөгдсөн ч, явагдаж буй ч бүгдийг буцаана.
    /// </summary>
    [HttpGet("{id:guid}/processes")]
    public async Task<IActionResult> GetProcesses(Guid id)
    {
        var result = await _processService.GetByComputerAsync(id);
        return Ok(ApiResponse<List<ProcessRequestListItem>>.Ok(result));
    }

    /// <summary>
    /// Тухайн компьютер дээр дууссан Засвар + Актын түүх (Completed).
    /// </summary>
    [HttpGet("{id:guid}/process-history")]
    public async Task<IActionResult> GetProcessHistory(Guid id)
    {
        var result = await _processService.GetHistoryAsync(id);
        return Ok(ApiResponse<List<ProcessHistoryItem>>.Ok(result));
    }

    [HttpGet("report/preview")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetReportPreview([FromQuery] ComputerReportFilterRequest filter)
    {
        var result = await _computerService.GetReportAsync(filter);
        return Ok(ApiResponse<ComputerReportSummary>.Ok(result));
    }

    [HttpGet("report/export")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> ExportReport([FromQuery] ComputerReportFilterRequest filter)
    {
        var bytes = await _computerService.ExportReportAsync(filter);
        var fileName = $"Computer_Report_{DateTime.UtcNow:yyyyMMdd_HHmm}.xlsx";
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }
}
