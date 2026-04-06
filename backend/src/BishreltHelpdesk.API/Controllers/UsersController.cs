using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Users;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = Policies.AdminOrAbove)]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IUserRepository _userRepository;

    public UsersController(IUserService userService, IUserRepository userRepository)
    {
        _userService = userService;
        _userRepository = userRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] UserFilterRequest filter)
    {
        var result = await _userService.GetListAsync(filter);
        return Ok(ApiResponse<PagedResult<UserResponse>>.Ok(result));
    }

    [HttpGet("grouped")]
    public async Task<IActionResult> GetGroupedByCompany()
    {
        var result = await _userService.GetGroupedByCompanyAsync();
        return Ok(ApiResponse<List<CompanyGroupedUsers>>.Ok(result));
    }

    [HttpGet("{id:guid}")]
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
    public async Task<IActionResult> GetEngineers()
    {
        var engineers = await _userRepository.GetEngineersAsync();
        var result = engineers.Select(e => new { e.Id, e.FullName }).ToList();
        return Ok(ApiResponse<object>.Ok(result));
    }
}
