namespace BishreltHelpdesk.Application.DTOs.Profile;

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? Position { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ComputerNumber { get; set; }
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
