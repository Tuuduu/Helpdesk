using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Settings;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Exceptions;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;

    public CompaniesController(
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        AppDbContext context)
    {
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _context = context;
    }

    // GET /api/companies — ticket үүсгэх dropdown-д ашиглах (бүх user)
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var companies = await _companyRepository.GetActiveCompaniesAsync();
        var result = companies.Select(c => new { c.Id, c.Name }).ToList();
        return Ok(ApiResponse<object>.Ok(result));
    }

    // GET /api/companies/manage — settings хуудасны бүрэн жагсаалт
    [HttpGet("manage")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> GetManageList()
    {
        var companies = await _context.Companies
            .OrderBy(c => c.Name)
            .Select(c => new CompanyResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Phone = c.Phone,
                Email = c.Email,
                Address = c.Address,
                IsActive = c.IsActive,
                TicketCount = c.Tickets.Count,
                UserCount = c.Users.Count,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<CompanyResponse>>.Ok(companies));
    }

    // POST /api/companies
    [HttpPost]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> Create([FromBody] CreateCompanyRequest request)
    {
        var existing = await _companyRepository.GetByNameAsync(request.Name);
        if (existing != null)
            throw new BadRequestException("Ийм нэртэй компани аль хэдийн байна");

        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            Address = request.Address?.Trim(),
            IsActive = true
        };

        await _companyRepository.AddAsync(company);
        await _unitOfWork.SaveChangesAsync();

        var response = MapToResponse(company, 0, 0);
        return Ok(ApiResponse<CompanyResponse>.Ok(response));
    }

    // PUT /api/companies/{id}
    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.AdminOrAbove)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCompanyRequest request)
    {
        var company = await _companyRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Компани олдсонгүй");

        if (!company.Name.Equals(request.Name, StringComparison.OrdinalIgnoreCase))
        {
            var existing = await _companyRepository.GetByNameAsync(request.Name);
            if (existing != null)
                throw new BadRequestException("Ийм нэртэй компани аль хэдийн байна");
        }

        company.Name = request.Name.Trim();
        company.Description = request.Description?.Trim();
        company.Phone = request.Phone?.Trim();
        company.Email = request.Email?.Trim();
        company.Address = request.Address?.Trim();
        company.IsActive = request.IsActive;

        _companyRepository.Update(company);
        await _unitOfWork.SaveChangesAsync();

        var ticketCount = await _context.Tickets.CountAsync(t => t.CompanyId == id);
        var userCount = await _context.Users.CountAsync(u => u.CompanyId == id);
        return Ok(ApiResponse<CompanyResponse>.Ok(MapToResponse(company, ticketCount, userCount)));
    }

    // DELETE /api/companies/{id}
    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var company = await _companyRepository.GetByIdAsync(id)
            ?? throw new NotFoundException("Компани олдсонгүй");

        var hasTickets = await _context.Tickets.AnyAsync(t => t.CompanyId == id);
        if (hasTickets)
            throw new BadRequestException("Тикеттэй компанийг устгах боломжгүй. Эхлээд идэвхгүй болгоно уу.");

        var hasUsers = await _context.Users.AnyAsync(u => u.CompanyId == id);
        if (hasUsers)
            throw new BadRequestException("Хэрэглэгчтэй компанийг устгах боломжгүй. Эхлээд идэвхгүй болгоно уу.");

        _companyRepository.Delete(company);
        await _unitOfWork.SaveChangesAsync();

        return Ok(ApiResponse<object>.Ok(null));
    }

    private static CompanyResponse MapToResponse(Company c, int ticketCount, int userCount) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Description = c.Description,
        Phone = c.Phone,
        Email = c.Email,
        Address = c.Address,
        IsActive = c.IsActive,
        TicketCount = ticketCount,
        UserCount = userCount,
        CreatedAt = c.CreatedAt
    };
}
