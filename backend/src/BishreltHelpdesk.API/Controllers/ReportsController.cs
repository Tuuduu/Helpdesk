using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Reports;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = Policies.AdminOrAbove)]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("preview")]
    public async Task<IActionResult> Preview([FromQuery] ReportFilterRequest filter)
    {
        var result = await _reportService.GetPreviewAsync(filter);
        return Ok(ApiResponse<ReportSummary>.Ok(result));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] ReportFilterRequest filter)
    {
        var bytes = await _reportService.ExportExcelAsync(filter);

        var fileName = $"Тайлан_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";

        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }
}
