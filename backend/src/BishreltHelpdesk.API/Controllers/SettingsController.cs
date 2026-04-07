using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Settings;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Policy = Policies.AdminOrAbove)]
public class SettingsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public SettingsController(AppDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    // ── Branding ────────────────────────────────────────────────────

    [HttpGet("branding")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBranding()
    {
        var configs = await _context.AppConfigs
            .Where(c => c.Key == "company_name" || c.Key == "company_subtitle" || c.Key == "logo_text")
            .ToListAsync();

        var result = new BrandingConfig
        {
            CompanyName = configs.FirstOrDefault(c => c.Key == "company_name")?.Value ?? "BISHRELT",
            CompanySubtitle = configs.FirstOrDefault(c => c.Key == "company_subtitle")?.Value ?? "GROUP",
            LogoText = configs.FirstOrDefault(c => c.Key == "logo_text")?.Value ?? "BG",
        };

        return Ok(ApiResponse<BrandingConfig>.Ok(result));
    }

    [HttpPut("branding")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> UpdateBranding([FromBody] UpdateBrandingRequest request)
    {
        await SetConfig("company_name", request.CompanyName.Trim().ToUpper());
        await SetConfig("company_subtitle", request.CompanySubtitle.Trim().ToUpper());
        await SetConfig("logo_text", request.LogoText.Trim().ToUpper());
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(null, "Амжилттай хадгалагдлаа"));
    }

    private async Task SetConfig(string key, string value)
    {
        var config = await _context.AppConfigs.FirstOrDefaultAsync(c => c.Key == key);
        if (config == null)
        {
            await _context.AppConfigs.AddAsync(new AppConfig { Id = Guid.NewGuid(), Key = key, Value = value });
        }
        else
        {
            config.Value = value;
            _context.AppConfigs.Update(config);
        }
    }

    // ── CallTypeConfig ──────────────────────────────────────────────

    [HttpGet("call-types")]
    [AllowAnonymous]
    [Authorize]
    public async Task<IActionResult> GetCallTypes()
    {
        var list = await _context.CallTypeConfigs
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Label)
            .Select(c => new CallTypeConfigResponse
            {
                Id = c.Id,
                Code = c.Code,
                Label = c.Label,
                Description = c.Description,
                IsActive = c.IsActive,
                SortOrder = c.SortOrder,
                DefaultPriority = c.DefaultPriority
            })
            .ToListAsync();

        return Ok(ApiResponse<List<CallTypeConfigResponse>>.Ok(list));
    }

    [HttpGet("call-types/active")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveCallTypes()
    {
        var list = await _context.CallTypeConfigs
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Label)
            .Select(c => new CallTypeConfigResponse
            {
                Id = c.Id,
                Code = c.Code,
                Label = c.Label,
                Description = c.Description,
                IsActive = c.IsActive,
                SortOrder = c.SortOrder,
                DefaultPriority = c.DefaultPriority
            })
            .ToListAsync();

        return Ok(ApiResponse<List<CallTypeConfigResponse>>.Ok(list));
    }

    [HttpPost("call-types")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> CreateCallType([FromBody] CreateCallTypeConfigRequest request)
    {
        var code = request.Code.Trim();
        if (await _context.CallTypeConfigs.AnyAsync(c => c.Code == code))
            throw new BadRequestException("Ийм кодтой дуудлагын төрөл аль хэдийн байна");

        var entity = new CallTypeConfig
        {
            Id = Guid.NewGuid(),
            Code = code,
            Label = request.Label.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            SortOrder = request.SortOrder,
            DefaultPriority = request.DefaultPriority
        };

        await _context.CallTypeConfigs.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<CallTypeConfigResponse>.Ok(Map(entity)));
    }

    [HttpPut("call-types/{id:guid}")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> UpdateCallType(Guid id, [FromBody] UpdateCallTypeConfigRequest request)
    {
        var entity = await _context.CallTypeConfigs.FindAsync(id)
            ?? throw new NotFoundException("Дуудлагын төрөл олдсонгүй");

        entity.Label = request.Label.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActive = request.IsActive;
        entity.SortOrder = request.SortOrder;
        entity.DefaultPriority = request.DefaultPriority;

        _context.CallTypeConfigs.Update(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<CallTypeConfigResponse>.Ok(Map(entity)));
    }

    [HttpDelete("call-types/{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> DeleteCallType(Guid id)
    {
        var entity = await _context.CallTypeConfigs.FindAsync(id)
            ?? throw new NotFoundException("Дуудлагын төрөл олдсонгүй");

        var inUse = await _context.Tickets.AnyAsync(t => t.CallType == entity.Code);
        if (inUse)
            throw new BadRequestException("Тикетэд ашиглагдсан дуудлагын төрлийг устгах боломжгүй. Эхлээд идэвхгүй болгоно уу.");

        _context.CallTypeConfigs.Remove(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(null));
    }

    private static CallTypeConfigResponse Map(CallTypeConfig c) => new()
    {
        Id = c.Id,
        Code = c.Code,
        Label = c.Label,
        Description = c.Description,
        IsActive = c.IsActive,
        SortOrder = c.SortOrder,
        DefaultPriority = c.DefaultPriority
    };
}
