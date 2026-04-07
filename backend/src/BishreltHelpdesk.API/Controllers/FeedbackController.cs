using System.Security.Claims;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Feedback;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbackController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest request)
    {
        var result = await _feedbackService.CreateAsync(request);
        return Ok(ApiResponse<FeedbackResponse>.Ok(result, "Үнэлгээ амжилттай бүртгэгдлээ"));
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] FeedbackFilterRequest filter)
    {
        var result = await _feedbackService.GetListAsync(filter);
        return Ok(ApiResponse<PagedResult<FeedbackResponse>>.Ok(result));
    }

    [HttpGet("ticket/{ticketId:guid}")]
    public async Task<IActionResult> GetForTicket(Guid ticketId)
    {
        var result = await _feedbackService.GetForTicketAsync(ticketId);
        return Ok(ApiResponse<FeedbackResponse?>.Ok(result));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyFeedback()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
        var result = await _feedbackService.GetMyFeedbacksAsync(userId);
        return Ok(ApiResponse<List<FeedbackResponse>>.Ok(result));
    }
}
