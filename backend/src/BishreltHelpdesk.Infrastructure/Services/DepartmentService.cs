using BishreltHelpdesk.Application.DTOs.Departments;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly IUnitOfWork _unitOfWork;

    public DepartmentService(
        AppDbContext context,
        ICurrentUserService currentUser,
        IUnitOfWork unitOfWork)
    {
        _context = context;
        _currentUser = currentUser;
        _unitOfWork = unitOfWork;
    }

    public async Task<List<DepartmentResponse>> GetListAsync(Guid? companyId)
    {
        var query = _context.Departments
            .Include(d => d.Company)
            .AsQueryable();

        // Multi-tenancy: бусад role өөрийн компанийг л харна
        if (_currentUser.Role != UserRole.SuperAdmin && _currentUser.CompanyId.HasValue)
            query = query.Where(d => d.CompanyId == _currentUser.CompanyId.Value);
        else if (companyId.HasValue)
            query = query.Where(d => d.CompanyId == companyId.Value);

        return await query
            .OrderBy(d => d.Company.Name)
            .ThenBy(d => d.Name)
            .Select(d => new DepartmentResponse
            {
                Id = d.Id,
                Name = d.Name,
                CompanyId = d.CompanyId,
                CompanyName = d.Company.Name,
                UserCount = _context.Users.Count(u => u.DepartmentId == d.Id),
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Хэлтсийн нэр заавал бөглөнө");

        var company = await _context.Companies.FindAsync(request.CompanyId)
            ?? throw new NotFoundException("Компани олдсонгүй");

        var name = request.Name.Trim();

        var exists = await _context.Departments
            .AnyAsync(d => d.CompanyId == request.CompanyId && d.Name.ToLower() == name.ToLower());
        if (exists)
            throw new BadRequestException($"'{name}' нэртэй хэлтэс энэ компанид аль хэдийн бүртгэгдсэн");

        var dept = new Department
        {
            Id = Guid.NewGuid(),
            Name = name,
            CompanyId = request.CompanyId
        };

        await _context.Departments.AddAsync(dept);
        await _unitOfWork.SaveChangesAsync();

        return new DepartmentResponse
        {
            Id = dept.Id,
            Name = dept.Name,
            CompanyId = dept.CompanyId,
            CompanyName = company.Name,
            UserCount = 0,
            CreatedAt = dept.CreatedAt
        };
    }

    public async Task<DepartmentResponse> UpdateAsync(Guid id, UpdateDepartmentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new BadRequestException("Хэлтсийн нэр заавал бөглөнө");

        var dept = await _context.Departments
            .Include(d => d.Company)
            .FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new NotFoundException("Хэлтэс олдсонгүй");

        var name = request.Name.Trim();

        var exists = await _context.Departments
            .AnyAsync(d => d.CompanyId == dept.CompanyId
                && d.Id != id
                && d.Name.ToLower() == name.ToLower());
        if (exists)
            throw new BadRequestException($"'{name}' нэртэй хэлтэс энэ компанид аль хэдийн бүртгэгдсэн");

        dept.Name = name;
        await _unitOfWork.SaveChangesAsync();

        return new DepartmentResponse
        {
            Id = dept.Id,
            Name = dept.Name,
            CompanyId = dept.CompanyId,
            CompanyName = dept.Company.Name,
            UserCount = await _context.Users.CountAsync(u => u.DepartmentId == dept.Id),
            CreatedAt = dept.CreatedAt
        };
    }

    public async Task DeleteAsync(Guid id)
    {
        var dept = await _context.Departments.FindAsync(id)
            ?? throw new NotFoundException("Хэлтэс олдсонгүй");

        // User-уудаас холбоосыг арилгана (SetNull)
        _context.Departments.Remove(dept);
        await _unitOfWork.SaveChangesAsync();
    }
}
