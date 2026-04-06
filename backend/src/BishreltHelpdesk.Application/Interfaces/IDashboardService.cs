using BishreltHelpdesk.Application.DTOs.Dashboard;

namespace BishreltHelpdesk.Application.Interfaces;

public interface IDashboardService
{
    Task<DashboardStatsResponse> GetStatsAsync(string period);
    Task<List<TicketChartItem>> GetTicketChartAsync(string period);
    Task<List<EngineerPerformanceItem>> GetEngineerPerformanceAsync(string period);
    Task<FeedbackSummaryResponse> GetFeedbackSummaryAsync(string period);
}
