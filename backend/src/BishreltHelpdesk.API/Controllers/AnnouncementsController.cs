using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Announcements;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/announcements")]
[Authorize(Policy = Policies.AdminOrAbove)]
public class AnnouncementsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public AnnouncementsController(AppDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetList()
    {
        var items = await _context.Announcements
            .OrderBy(a => a.SortOrder)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new AnnouncementResponse
            {
                Id = a.Id,
                Title = a.Title,
                Body = a.Body,
                Level = a.Level,
                SortOrder = a.SortOrder,
                IsActive = a.IsActive,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<AnnouncementResponse>>.Ok(items));
    }

    // Create: Admin or above (matches Vendor pattern)
    [HttpPost]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateAnnouncementRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Гарчиг оруулна уу");
        if (string.IsNullOrWhiteSpace(request.Body))
            throw new BadRequestException("Агуулга оруулна уу");

        var entity = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Body = request.Body.Trim(),
            Level = NormalizeLevel(request.Level),
            SortOrder = request.SortOrder,
            IsActive = true
        };

        await _context.Announcements.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<Guid>.Ok(entity.Id, "Мэдэгдэл нэмэгдлээ"));
    }

    // Update + Delete: SuperAdmin only
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAnnouncementRequest request)
    {
        var entity = await _context.Announcements.FindAsync(id)
            ?? throw new NotFoundException("Мэдэгдэл олдсонгүй");

        if (string.IsNullOrWhiteSpace(request.Title))
            throw new BadRequestException("Гарчиг оруулна уу");
        if (string.IsNullOrWhiteSpace(request.Body))
            throw new BadRequestException("Агуулга оруулна уу");

        entity.Title = request.Title.Trim();
        entity.Body = request.Body.Trim();
        entity.Level = NormalizeLevel(request.Level);
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;

        await _unitOfWork.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Шинэчлэгдлээ"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _context.Announcements.FindAsync(id)
            ?? throw new NotFoundException("Мэдэгдэл олдсонгүй");

        _context.Announcements.Remove(entity);
        await _unitOfWork.SaveChangesAsync();
        return Ok(ApiResponse.Ok("Устгагдлаа"));
    }

    private static string NormalizeLevel(string? level)
    {
        var l = (level ?? "info").Trim().ToLower();
        return l switch
        {
            "warning" or "success" or "danger" or "info" => l,
            _ => "info"
        };
    }
}
