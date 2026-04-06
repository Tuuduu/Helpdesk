using BishreltHelpdesk.Application.DTOs.Auth;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<LoginResponse> RegisterAsync(RegisterRequest request);
    Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request);
    Task LogoutAsync(string refreshToken);
}
