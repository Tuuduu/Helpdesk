using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Users;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserResponse>> GetListAsync(UserFilterRequest filter);
    Task<List<CompanyGroupedUsers>> GetGroupedByCompanyAsync();
    Task<UserResponse> GetByIdAsync(Guid id);
    Task<UserResponse> CreateAsync(CreateUserRequest request);
    Task<UserResponse> UpdateAsync(Guid id, UpdateUserRequest request);
    Task DeleteAsync(Guid id);
    Task HardDeleteAsync(Guid id);
    Task ResetPasswordAsync(Guid id, ResetUserPasswordRequest request);
}
