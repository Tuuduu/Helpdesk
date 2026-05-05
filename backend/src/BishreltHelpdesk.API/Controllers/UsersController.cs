using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Users;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishreltHelpdesk.Infrastructure.Data;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly AppDbContext _context;

    public UsersController(
        IUserService userService,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        AppDbContext context)
    {
        _userService = userService;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _context = context;
    }

    [HttpGet]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetList([FromQuery] UserFilterRequest filter)
    {
        var result = await _userService.GetListAsync(filter);
        return Ok(ApiResponse<PagedResult<UserResponse>>.Ok(result));
    }

    [HttpGet("grouped")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetGroupedByCompany()
    {
        var result = await _userService.GetGroupedByCompanyAsync();
        return Ok(ApiResponse<List<CompanyGroupedUsers>>.Ok(result));
    }

    /// <summary>
    /// Тухайн нэвтэрсэн хэрэглэгчийн компанийн идэвхтэй ажилтнуудын
    /// тоймлогдсон жагсаалт. Шилжүүлгийн хүсэлт гэх мэт User-ийн ашигладаг
    /// dropdown-уудад хэрэглэхээр зориулсан.
    /// </summary>
    [HttpGet("colleagues")]
    public async Task<IActionResult> GetColleagues()
    {
        var companyId = _currentUser.CompanyId;
        if (!companyId.HasValue)
            return Ok(ApiResponse<List<object>>.Ok(new List<object>()));

        var users = await _context.Users
            .Where(u => u.CompanyId == companyId.Value && u.IsActive)
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                id = u.Id,
                fullName = u.FullName,
                position = u.Position,
                companyId = u.CompanyId
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(users));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _userService.GetByIdAsync(id);
        return Ok(ApiResponse<UserResponse>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var result = await _userService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = result.Id },
            ApiResponse<UserResponse>.Ok(result, "Хэрэглэгч амжилттай үүсгэлээ"));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var result = await _userService.UpdateAsync(id, request);
        return Ok(ApiResponse<UserResponse>.Ok(result, "Хэрэглэгч амжилттай шинэчлэгдлээ"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _userService.DeleteAsync(id);
        return Ok(ApiResponse.Ok("Хэрэглэгч идэвхгүй болгогдлоо"));
    }

    [HttpDelete("{id:guid}/permanent")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> HardDelete(Guid id)
    {
        await _userService.HardDeleteAsync(id);
        return Ok(ApiResponse.Ok("Хэрэглэгч бүрмөсөн устгагдлаа"));
    }

    [HttpGet("engineers")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetEngineers()
    {
        var engineers = await _userRepository.GetEngineersAsync();
        var result = engineers.Select(e => new { e.Id, e.FullName }).ToList();
        return Ok(ApiResponse<object>.Ok(result));
    }

    /// <summary>
    /// Бүх компанийн workflow-д approver болж чадах хэрэглэгчид:
    /// SuperAdmin-ууд + IsGlobalApprover=true тохируулсан Admin-ууд.
    /// Settings → Шилжүүлгийн урсгал tab дотор approver picker-т ашиглана.
    /// </summary>
    [HttpGet("global-approvers")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetGlobalApprovers()
    {
        var users = await _context.Users
            .Include(u => u.Company)
            .Where(u => u.IsActive
                && (u.Role == Domain.Enums.UserRole.SuperAdmin || u.IsGlobalApprover))
            .OrderBy(u => u.Company.Name)
            .ThenBy(u => u.FullName)
            .Select(u => new
            {
                id = u.Id,
                fullName = u.FullName,
                position = u.Position,
                companyId = u.CompanyId,
                companyName = u.Company.Name,
                role = u.Role.ToString(),
                isGlobalApprover = u.IsGlobalApprover
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(users));
    }
}
