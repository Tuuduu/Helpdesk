using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Departments;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _service;

    public DepartmentsController(IDepartmentService service)
    {
        _service = service;
    }

    /// <summary>
    /// Хэлтсийн жагсаалт. Нийтэд нээлттэй — анхны бүртгүүлэлт, тикет
    /// захиалах формд dropdown болж ажиллах боломжтой.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetList([FromQuery] Guid? companyId)
    {
        var result = await _service.GetListAsync(companyId);
        return Ok(ApiResponse<List<DepartmentResponse>>.Ok(result));
    }

    [HttpPost]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request)
    {
        var result = await _service.CreateAsync(request);
        return Ok(ApiResponse<DepartmentResponse>.Ok(result, "Хэлтэс үүслээ"));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDepartmentRequest request)
    {
        var result = await _service.UpdateAsync(id, request);
        return Ok(ApiResponse<DepartmentResponse>.Ok(result, "Шинэчиллээ"));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return Ok(ApiResponse.Ok("Хэлтэс устгагдлаа"));
    }
}
