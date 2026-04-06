using BishreltHelpdesk.Domain.Entities;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    DateTime GetAccessTokenExpiration();
}
