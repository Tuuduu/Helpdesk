using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Vendors;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/vendor-contacts")]
[Authorize(Policy = Policies.AdminOrAbove)]
public class VendorContactsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public VendorContactsController(AppDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] Guid? typeId = null, [FromQuery] string? search = null)
    {
        var query = _context.VendorContacts
            .Include(v => v.VendorType)
            .AsQueryable();

        if (typeId.HasValue)
            query = query.Where(v => v.VendorTypeId == typeId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(v =>
                v.CompanyName.ToLower().Contains(s) ||
                (v.AccountManager != null && v.AccountManager.ToLower().Contains(s)) ||
                (v.Phone != null && v.Phone.ToLower().Contains(s)) ||
                (v.Email != null && v.Email.ToLower().Contains(s)));
        }

        var items = await query
            .OrderBy(v => v.VendorType.Name)
            .ThenBy(v => v.CompanyName)
            .Select(v => new VendorContactResponse
            {
                Id = v.Id,
                VendorTypeId = v.VendorTypeId,
                VendorTypeName = v.VendorType.Name,
                CompanyName = v.CompanyName,
                AccountManager = v.AccountManager,
                Phone = v.Phone,
                Email = v.Email,
                Description = v.Description,
                IsActive = v.IsActive,
                ShowOnLoginPage = v.ShowOnLoginPage,
                CreatedAt = v.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<VendorContactResponse>>.Ok(items));
    }

    // Create: Admin or above (per requirement: admin can add)
    [HttpPost]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateVendorContactRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CompanyName))
            throw new BadRequestException("Компанийн нэр оруулна уу");

        var type = await _context.VendorTypes.FindAsync(request.VendorTypeId)
            ?? throw new BadRequestException("Төрөл олдсонгүй");

        var entity = new VendorContact
        {
            Id = Guid.NewGuid(),
            VendorTypeId = type.Id,
            CompanyName = request.CompanyName.Trim(),
            AccountManager = request.AccountManager?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            ShowOnLoginPage = request.ShowOnLoginPage
        };

        await _context.VendorContacts.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<Guid>.Ok(entity.Id, "Харилцагч бүртгэгдлээ"));
    }

    // Update: SuperAdmin only (per requirement)
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVendorContactRequest request)
    {
        var entity = await _context.VendorContacts.FindAsync(id)
            ?? throw new NotFoundException("Харилцагч олдсонгүй");

        if (string.IsNullOrWhiteSpace(request.CompanyName))
            throw new BadRequestException("Компанийн нэр оруулна уу");

        var type = await _context.VendorTypes.FindAsync(request.VendorTypeId)
            ?? throw new BadRequestException("Төрөл олдсонгүй");

        entity.VendorTypeId = type.Id;
        entity.CompanyName = request.CompanyName.Trim();
        entity.AccountManager = request.AccountManager?.Trim();
        entity.Phone = request.Phone?.Trim();
        entity.Email = request.Email?.Trim();
        entity.Description = request.Description?.Trim();
        entity.IsActive = request.IsActive;
        entity.ShowOnLoginPage = request.ShowOnLoginPage;

        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Шинэчлэгдлээ"));
    }

    // Delete: SuperAdmin only (per requirement)
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entity = await _context.VendorContacts.FindAsync(id)
            ?? throw new NotFoundException("Харилцагч олдсонгүй");

        _context.VendorContacts.Remove(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Устгагдлаа"));
    }

    // ── VendorTypes (settings) ──

    [HttpGet("types")]
    public async Task<IActionResult> GetTypes()
    {
        var items = await _context.VendorTypes
            .OrderBy(t => t.SortOrder)
            .ThenBy(t => t.Name)
            .Select(t => new VendorTypeResponse
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                SortOrder = t.SortOrder,
                IsActive = t.IsActive,
                VendorCount = t.Vendors.Count
            })
            .ToListAsync();

        return Ok(ApiResponse<List<VendorTypeResponse>>.Ok(items));
    }

    [HttpPost("types")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> CreateType([FromBody] CreateVendorTypeRequest request)
    {
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("Төрлийн нэр оруулна уу");

        if (await _context.VendorTypes.AnyAsync(t => t.Name.ToLower() == name.ToLower()))
            throw new BadRequestException("Ийм нэртэй төрөл аль хэдийн байна");

        var entity = new VendorType
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = request.Description?.Trim(),
            SortOrder = request.SortOrder,
            IsActive = true
        };

        await _context.VendorTypes.AddAsync(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<Guid>.Ok(entity.Id, "Төрөл нэмэгдлээ"));
    }

    [HttpPut("types/{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> UpdateType(Guid id, [FromBody] UpdateVendorTypeRequest request)
    {
        var entity = await _context.VendorTypes.FindAsync(id)
            ?? throw new NotFoundException("Төрөл олдсонгүй");

        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new BadRequestException("Төрлийн нэр оруулна уу");

        entity.Name = name;
        entity.Description = request.Description?.Trim();
        entity.SortOrder = request.SortOrder;
        entity.IsActive = request.IsActive;

        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Шинэчлэгдлээ"));
    }

    [HttpDelete("types/{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> DeleteType(Guid id)
    {
        var hasVendors = await _context.VendorContacts.AnyAsync(v => v.VendorTypeId == id);
        if (hasVendors)
            throw new BadRequestException("Энэ төрөлд бүртгэлтэй харилцагч байгаа тул устгах боломжгүй");

        var entity = await _context.VendorTypes.FindAsync(id)
            ?? throw new NotFoundException("Төрөл олдсонгүй");

        _context.VendorTypes.Remove(entity);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Устгагдлаа"));
    }
}
