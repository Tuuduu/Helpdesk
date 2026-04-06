using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Dashboard;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = Policies.AdminOrAbove)]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats([FromQuery] string period = "month")
    {
        var result = await _dashboardService.GetStatsAsync(period);
        return Ok(ApiResponse<DashboardStatsResponse>.Ok(result));
    }

    [HttpGet("ticket-chart")]
    public async Task<IActionResult> GetTicketChart([FromQuery] string period = "month")
    {
        var result = await _dashboardService.GetTicketChartAsync(period);
        return Ok(ApiResponse<List<TicketChartItem>>.Ok(result));
    }

    [HttpGet("engineers")]
    public async Task<IActionResult> GetEngineerPerformance([FromQuery] string period = "month")
    {
        var result = await _dashboardService.GetEngineerPerformanceAsync(period);
        return Ok(ApiResponse<List<EngineerPerformanceItem>>.Ok(result));
    }

    [HttpGet("feedback")]
    public async Task<IActionResult> GetFeedbackSummary([FromQuery] string period = "month")
    {
        var result = await _dashboardService.GetFeedbackSummaryAsync(period);
        return Ok(ApiResponse<FeedbackSummaryResponse>.Ok(result));
    }
}
