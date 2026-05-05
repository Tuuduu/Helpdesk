using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Application.DTOs.Users;

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public Guid? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? Position { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ComputerNumber { get; set; }
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; }
    public bool IsGlobalApprover { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? Position { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ComputerNumber { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public bool IsGlobalApprover { get; set; } = false;
}

public class UpdateUserRequest
{
    public string? FullName { get; set; }
    public Guid? CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? Position { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ComputerNumber { get; set; }
    public UserRole? Role { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsGlobalApprover { get; set; }
}

public class UserFilterRequest : PagedRequest
{
    public Guid? CompanyId { get; set; }
    public UserRole? Role { get; set; }
    public string? Search { get; set; }
    public bool? IsActive { get; set; }
}

public class CompanyGroupedUsers
{
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public List<UserResponse> Users { get; set; } = new();
}
