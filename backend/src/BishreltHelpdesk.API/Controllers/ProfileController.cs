using BishreltHelpdesk.Application.DTOs.Auth;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Profile;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IPasswordHashService _passwordHashService;

    public ProfileController(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IPasswordHashService passwordHashService)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _passwordHashService = passwordHashService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await GetCurrentUser();

        return Ok(ApiResponse<UserInfo>.Ok(MapToUserInfo(user)));
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        var user = await GetCurrentUser();

        if (request.FullName != null) user.FullName = request.FullName;
        if (request.Position != null) user.Position = request.Position;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
        if (request.ComputerNumber != null) user.ComputerNumber = request.ComputerNumber;

        // DepartmentId: explicitly handle empty Guid as "clear", real Guid as "set"
        if (request.DepartmentId.HasValue)
        {
            user.DepartmentId = request.DepartmentId.Value == Guid.Empty
                ? null
                : request.DepartmentId.Value;
        }

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var updated = await _userRepository.GetByEmailAsync(user.Email)
            ?? throw new NotFoundException("Хэрэглэгч олдсонгүй");

        return Ok(ApiResponse<UserInfo>.Ok(MapToUserInfo(updated), "Профайл амжилттай шинэчлэгдлээ"));
    }

    private static UserInfo MapToUserInfo(Domain.Entities.User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role.ToString(),
        CompanyId = user.CompanyId,
        CompanyName = user.Company?.Name ?? "",
        DepartmentId = user.DepartmentId,
        DepartmentName = user.Department?.Name,
        Position = user.Position,
        PhoneNumber = user.PhoneNumber,
        ComputerNumber = user.ComputerNumber,
        AvatarUrl = user.AvatarUrl,
        IsGlobalApprover = user.IsGlobalApprover
    };

    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await GetCurrentUser();

        if (!_passwordHashService.Verify(request.CurrentPassword, user.PasswordHash))
            throw new BadRequestException("Одоогийн нууц үг буруу байна");

        user.PasswordHash = _passwordHashService.Hash(request.NewPassword);

        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Нууц үг амжилттай солигдлоо"));
    }

    private async Task<Domain.Entities.User> GetCurrentUser()
    {
        var userId = _currentUser.UserId
            ?? throw new UnauthorizedAccessException();

        return await _userRepository.GetByEmailAsync(
            (await _userRepository.GetByIdAsync(userId)
                ?? throw new NotFoundException("Хэрэглэгч олдсонгүй")).Email)
            ?? throw new NotFoundException("Хэрэглэгч олдсонгүй");
    }
}
