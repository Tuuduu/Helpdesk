using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    Guid? CompanyId { get; }
}
