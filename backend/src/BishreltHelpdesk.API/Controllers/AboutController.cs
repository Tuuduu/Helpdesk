using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.Application.DTOs.About;
using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishreltHelpdesk.API.Controllers;

[ApiController]
[Route("api/about")]
[Authorize]
public class AboutController : ControllerBase
{
    private readonly IAboutService _aboutService;

    public AboutController(IAboutService aboutService)
    {
        _aboutService = aboutService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _aboutService.GetAsync();
        return Ok(ApiResponse<AboutResponse>.Ok(result));
    }

    [HttpPut]
    [Authorize(Policy = Policies.SuperAdminOnly)]
    public async Task<IActionResult> Update([FromBody] UpdateAboutRequest request)
    {
        var result = await _aboutService.UpdateAsync(request);
        return Ok(ApiResponse<AboutResponse>.Ok(result, "Тухай хуудас шинэчлэгдлээ"));
    }
}
