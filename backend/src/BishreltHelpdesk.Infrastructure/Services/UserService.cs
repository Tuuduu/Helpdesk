using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Users;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPasswordHashService _passwordHashService;
    private readonly AppDbContext _context;

    public UserService(
        IUserRepository userRepository,
        IUnitOfWork unitOfWork,
        IPasswordHashService passwordHashService,
        AppDbContext context)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _passwordHashService = passwordHashService;
        _context = context;
    }

    public async Task<PagedResult<UserResponse>> GetListAsync(UserFilterRequest filter)
    {
        var query = _context.Users
            .Include(u => u.Company)
            .Include(u => u.Department)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(u =>
                u.FullName.ToLower().Contains(search) ||
                u.Email.ToLower().Contains(search) ||
                u.Company.Name.ToLower().Contains(search));
        }

        if (filter.CompanyId.HasValue)
            query = query.Where(u => u.CompanyId == filter.CompanyId.Value);

        if (filter.Role.HasValue)
            query = query.Where(u => u.Role == filter.Role.Value);

        if (filter.IsActive.HasValue)
            query = query.Where(u => u.IsActive == filter.IsActive.Value);

        query = filter.SortBy?.ToLower() switch
        {
            "fullname" => filter.SortDescending
                ? query.OrderByDescending(u => u.FullName)
                : query.OrderBy(u => u.FullName),
            "email" => filter.SortDescending
                ? query.OrderByDescending(u => u.Email)
                : query.OrderBy(u => u.Email),
            "role" => filter.SortDescending
                ? query.OrderByDescending(u => u.Role)
                : query.OrderBy(u => u.Role),
            _ => filter.SortDescending
                ? query.OrderByDescending(u => u.CreatedAt)
                : query.OrderBy(u => u.CreatedAt)
        };

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(u => MapToResponse(u))
            .ToListAsync();

        return new PagedResult<UserResponse>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<List<CompanyGroupedUsers>> GetGroupedByCompanyAsync()
    {
        return await _context.Companies
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new CompanyGroupedUsers
            {
                CompanyId = c.Id,
                CompanyName = c.Name,
                Users = c.Users
                    .OrderBy(u => u.FullName)
                    .Select(u => new UserResponse
                    {
                        Id = u.Id,
                        Email = u.Email,
                        FullName = u.FullName,
                        CompanyId = u.CompanyId,
                        CompanyName = c.Name,
                        Position = u.Position,
                        PhoneNumber = u.PhoneNumber,
                        ComputerNumber = u.ComputerNumber,
                        Role = u.Role.ToString(),
                        AvatarUrl = u.AvatarUrl,
                        IsActive = u.IsActive,
                        CreatedAt = u.CreatedAt
                    })
                    .ToList()
            })
            .ToListAsync();
    }

    public async Task<UserResponse> GetByIdAsync(Guid id)
    {
        var user = await _context.Users
            .Include(u => u.Company)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException("Хэрэглэгч олдсонгүй");

        return MapToResponse(user);
    }

    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        if (await _userRepository.EmailExistsAsync(request.Email))
            throw new BadRequestException("Энэ имэйл бүртгэлтэй байна");

        var company = await _context.Companies.FindAsync(request.CompanyId)
            ?? throw new BadRequestException("Компани олдсонгүй");

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
            Role = request.Role,
            IsActive = true
        };

        await _userRepository.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserResponse> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Company)
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException("Хэрэглэгч олдсонгүй");

        if (request.FullName != null) user.FullName = request.FullName;
        if (request.Position != null) user.Position = request.Position;
        if (request.PhoneNumber != null) user.PhoneNumber = request.PhoneNumber;
        if (request.ComputerNumber != null) user.ComputerNumber = request.ComputerNumber;
        if (request.Role.HasValue) user.Role = request.Role.Value;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        if (request.CompanyId.HasValue && request.CompanyId.Value != user.CompanyId)
        {
            var company = await _context.Companies.FindAsync(request.CompanyId.Value)
                ?? throw new BadRequestException("Компани олдсонгүй");
            user.CompanyId = request.CompanyId.Value;
            user.Company = company;
            // Компани солигдвол хэлтсийг хүчингүй болгох (давхар компанийн хэлтэс байж болохгүй)
            user.DepartmentId = null;
            user.Department = null;
        }

        if (request.DepartmentId.HasValue)
        {
            var dept = await _context.Departments.FindAsync(request.DepartmentId.Value)
                ?? throw new BadRequestException("Хэлтэс олдсонгүй");
            if (dept.CompanyId != user.CompanyId)
                throw new BadRequestException("Хэлтэс хэрэглэгчийн компанид харьяалагдахгүй байна");
            user.DepartmentId = dept.Id;
            user.Department = dept;
        }

        await _unitOfWork.SaveChangesAsync();

        return MapToResponse(user);
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Хэрэглэгч олдсонгүй");

        // Soft delete — deactivate instead of removing
        user.IsActive = false;
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task HardDeleteAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Хэрэглэгч олдсонгүй");

        _userRepository.Delete(user);
        await _unitOfWork.SaveChangesAsync();
    }

    private static UserResponse MapToResponse(User u)
    {
        return new UserResponse
        {
            Id = u.Id,
            Email = u.Email,
            FullName = u.FullName,
            CompanyId = u.CompanyId,
            CompanyName = u.Company?.Name ?? "",
            DepartmentId = u.DepartmentId,
            DepartmentName = u.Department?.Name,
            Position = u.Position,
            PhoneNumber = u.PhoneNumber,
            ComputerNumber = u.ComputerNumber,
            Role = u.Role.ToString(),
            AvatarUrl = u.AvatarUrl,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
        };
    }
}
