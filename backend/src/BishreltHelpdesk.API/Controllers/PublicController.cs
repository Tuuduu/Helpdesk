using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.API.Controllers;

/// <summary>
/// Login хуудсанд харагдах хариуцлагатай ажилтнууд + харилцагч лавлахын
/// нийтэд нээлттэй (анонимаар) уншигдах эндпойнт.
/// </summary>
[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublicController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("announcements")]
    public async Task<IActionResult> GetAnnouncements()
    {
        var items = await _context.Announcements
            .Where(a => a.IsActive)
            .OrderBy(a => a.SortOrder)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                id = a.Id,
                title = a.Title,
                body = a.Body,
                level = a.Level,
                createdAt = a.CreatedAt
            })
            .ToListAsync();
        return Ok(ApiResponse<object>.Ok(items));
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> GetContacts()
    {
        var engineers = await _context.Users
            .Where(u => u.IsActive
                && u.ShowOnLoginPage
                && (u.Role == UserRole.Admin || u.Role == UserRole.SuperAdmin))
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                id = u.Id,
                fullName = u.FullName,
                position = u.Position,
                phone = u.PhoneNumber,
                email = u.Email,
                avatarUrl = u.AvatarUrl
            })
            .ToListAsync();

        var vendors = await _context.VendorContacts
            .Include(v => v.VendorType)
            .Where(v => v.IsActive && v.ShowOnLoginPage && v.VendorType.IsActive)
            .OrderBy(v => v.VendorType.SortOrder)
            .ThenBy(v => v.VendorType.Name)
            .ThenBy(v => v.CompanyName)
            .Select(v => new
            {
                id = v.Id,
                vendorTypeName = v.VendorType.Name,
                companyName = v.CompanyName,
                accountManager = v.AccountManager,
                phone = v.Phone,
                email = v.Email,
                description = v.Description
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(new { engineers, vendors }));
    }
}
