using System.Security.Claims;
using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Tickets;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetList([FromQuery] TicketFilterRequest filter)
    {
        var result = await _ticketService.GetListAsync(filter);
        return Ok(ApiResponse<PagedResult<TicketListItem>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _ticketService.GetByIdAsync(id);
        return Ok(ApiResponse<TicketResponse>.Ok(result));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        var result = await _ticketService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<TicketResponse>.Ok(result, "Тикет амжилттай үүсгэлээ"));
    }

    [HttpPost("public")]
    [AllowAnonymous]
    public async Task<IActionResult> CreatePublic([FromBody] PublicTicketRequest request)
    {
        var result = await _ticketService.CreatePublicAsync(request);
        return Ok(ApiResponse<PublicTicketResponse>.Ok(result, "Тикет амжилттай бүртгэгдлээ"));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTicketStatusRequest request)
    {
        var result = await _ticketService.UpdateStatusAsync(id, request);
        return Ok(ApiResponse<TicketResponse>.Ok(result));
    }

    [HttpPatch("{id:guid}/assign")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignTicketRequest request)
    {
        var result = await _ticketService.AssignAsync(id, request);
        return Ok(ApiResponse<TicketResponse>.Ok(result));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _ticketService.DeleteAsync(id);
        return Ok(ApiResponse.Ok("Тикет устгагдлаа"));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyTickets([FromQuery] PagedRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await _ticketService.GetMyTicketsAsync(userId, request);
        return Ok(ApiResponse<PagedResult<TicketListItem>>.Ok(result));
    }
}
