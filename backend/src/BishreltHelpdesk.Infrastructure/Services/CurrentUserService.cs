using System.Security.Claims;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace BishreltHelpdesk.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User?.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? Email => User?.FindFirstValue(ClaimTypes.Email)
                            ?? User?.FindFirstValue("email");

    public UserRole? Role
    {
        get
        {
            var role = User?.FindFirstValue("role");
            return Enum.TryParse<UserRole>(role, out var parsed) ? parsed : null;
        }
    }

    public Guid? CompanyId
    {
        get
        {
            var companyId = User?.FindFirstValue("companyId");
            return Guid.TryParse(companyId, out var id) ? id : null;
        }
    }
}
