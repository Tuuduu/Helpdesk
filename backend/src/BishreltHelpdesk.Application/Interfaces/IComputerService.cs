using BishreltHelpdesk.Application.DTOs.Common;
using BishreltHelpdesk.Application.DTOs.Computers;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IComputerService
{
    Task<ComputerResponse> CreateAsync(CreateComputerRequest request);
    Task<ComputerResponse> UpdateAsync(Guid id, UpdateComputerRequest request);
    Task<ComputerResponse> GetByIdAsync(Guid id);
    Task<PagedResult<ComputerListItem>> GetListAsync(ComputerFilterRequest filter);
    Task<List<ComputerListItem>> GetMyComputersAsync();
    Task DeleteAsync(Guid id);
    Task<ComputerImageDto> UploadImageAsync(Guid computerId, UploadFileInput file, bool isPrimary);
    Task DeleteImageAsync(Guid computerId, Guid imageId);
    Task<ComputerDashboardResponse> GetDashboardAsync();
    Task<ComputerReportSummary> GetReportAsync(ComputerReportFilterRequest filter);
    Task<byte[]> ExportReportAsync(ComputerReportFilterRequest filter);
}
