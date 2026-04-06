using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/companies")]
[Authorize]
public class CompaniesController : ControllerBase
{
    private readonly ICompanyRepository _companyRepository;

    public CompaniesController(ICompanyRepository companyRepository)
    {
        _companyRepository = companyRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var companies = await _companyRepository.GetActiveCompaniesAsync();
        var result = companies.Select(c => new { c.Id, c.Name }).ToList();
        return Ok(ApiResponse<object>.Ok(result));
    }
}
