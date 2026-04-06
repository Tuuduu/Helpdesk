using BishreltHelpdesk.Application.DTOs.Reports;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IReportService
{
    Task<ReportSummary> GetPreviewAsync(ReportFilterRequest filter);
    Task<byte[]> ExportExcelAsync(ReportFilterRequest filter);
}
