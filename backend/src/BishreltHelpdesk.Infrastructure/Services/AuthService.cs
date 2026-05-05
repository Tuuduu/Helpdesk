using BishreltHelpdesk.Application.DTOs.Auth;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BishreltHelpdesk.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHashService _passwordHashService;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IJwtTokenService jwtTokenService,
        IPasswordHashService passwordHashService,
        AppDbContext context,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _jwtTokenService = jwtTokenService;
        _passwordHashService = passwordHashService;
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user is null || !_passwordHashService.Verify(request.Password, user.PasswordHash))
            throw new BadRequestException("Имэйл эсвэл нууц үг буруу байна");

        if (!user.IsActive)
            throw new BadRequestException("Таны бүртгэл идэвхгүй байна");

        return await GenerateAuthResponse(user);
    }

    public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
                .ThenInclude(u => u.Company)
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken is null || storedToken.IsRevoked || storedToken.ExpiresAt <= DateTime.UtcNow)
            throw new BadRequestException("Refresh token хүчингүй байна");

        if (!storedToken.User.IsActive)
            throw new BadRequestException("Таны бүртгэл идэвхгүй байна");

        // Revoke old token
        storedToken.IsRevoked = true;

        // Generate new tokens
        var response = await GenerateAuthResponse(storedToken.User);
        await _unitOfWork.SaveChangesAsync();

        return response;
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken is not null)
        {
            storedToken.IsRevoked = true;
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task<LoginResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
            throw new BadRequestException("Энэ имэйл бүртгэлтэй байна");

        var company = await _context.Companies.FindAsync(request.CompanyId);
        if (company is null)
            throw new BadRequestException("Компани олдсонгүй");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHashService.Hash(request.Password),
            FullName = request.FullName,
            CompanyId = request.CompanyId,
            DepartmentId = request.DepartmentId,
            Position = request.Position,
            PhoneNumber = request.PhoneNumber,
            ComputerNumber = request.ComputerNumber,
            Role = Domain.Enums.UserRole.User,
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        // Reload with Company included
        var createdUser = await _userRepository.GetByEmailAsync(user.Email);
        return await GenerateAuthResponse(createdUser!);
    }

    private async Task<LoginResponse> GenerateAuthResponse(User user)
    {
        var accessToken = _jwtTokenService.GenerateAccessToken(user);
        var refreshTokenValue = _jwtTokenService.GenerateRefreshToken();
        var expiresAt = _jwtTokenService.GetAccessTokenExpiration();

        var refreshDays = int.Parse(_configuration["Jwt:RefreshTokenExpirationDays"] ?? "7");

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshDays),
            IsRevoked = false
        };

        await _context.RefreshTokens.AddAsync(refreshToken);
        await _unitOfWork.SaveChangesAsync();

        return new LoginResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresAt = expiresAt,
            User = new UserInfo
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
            }
        };
    }
}
