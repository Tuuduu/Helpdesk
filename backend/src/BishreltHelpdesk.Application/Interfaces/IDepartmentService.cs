using BishreltHelpdesk.Application.DTOs.Departments;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IDepartmentService
{
    Task<List<DepartmentResponse>> GetListAsync(Guid? companyId);
    Task<DepartmentResponse> CreateAsync(CreateDepartmentRequest request);
    Task<DepartmentResponse> UpdateAsync(Guid id, UpdateDepartmentRequest request);
    Task DeleteAsync(Guid id);
}
