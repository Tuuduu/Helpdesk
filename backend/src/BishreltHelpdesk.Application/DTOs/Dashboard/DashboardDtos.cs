namespace BishreltHelpdesk.Application.DTOs.Dashboard;

public class DashboardStatsResponse
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ClosedTickets { get; set; }
    public double AvgResolutionHours { get; set; }
}

public class TicketChartItem
{
    public string Date { get; set; } = string.Empty;
    public int Created { get; set; }
    public int Closed { get; set; }
}

public class EngineerPerformanceItem
{
    public Guid EngineerId { get; set; }
    public string EngineerName { get; set; } = string.Empty;
    public int AssignedCount { get; set; }
    public int ResolvedCount { get; set; }
    public double AvgResolutionHours { get; set; }
}

public class FeedbackSummaryResponse
{
    public double AverageRating { get; set; }
    public int TotalCount { get; set; }
    public Dictionary<int, int> Distribution { get; set; } = new();
}
