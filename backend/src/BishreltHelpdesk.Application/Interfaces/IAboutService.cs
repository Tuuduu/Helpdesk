using BishreltHelpdesk.Application.DTOs.About;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IAboutService
{
    Task<AboutResponse> GetAsync();
    Task<AboutResponse> UpdateAsync(UpdateAboutRequest request);
}
