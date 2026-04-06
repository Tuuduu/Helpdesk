using BishreltHelpdesk.Application.DTOs.Dashboard;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsResponse> GetStatsAsync(string period)
    {
        var from = GetDateFrom(period);

        var query = _context.Tickets.AsQueryable();
        if (from.HasValue)
            query = query.Where(t => t.CreatedAt >= from.Value);

        var total = await query.CountAsync();
        var open = await query.CountAsync(t =>
            t.Status != TicketStatus.Closed);
        var closed = await query.CountAsync(t =>
            t.Status == TicketStatus.Closed);

        // Average resolution time for closed tickets
        var avgHours = 0.0;
        var closedTickets = await query
            .Where(t => t.Status == TicketStatus.Closed && t.ClosedAt != null)
            .Select(t => new { t.CreatedAt, t.ClosedAt })
            .ToListAsync();

        if (closedTickets.Count > 0)
        {
            avgHours = closedTickets
                .Average(t => (t.ClosedAt!.Value - t.CreatedAt).TotalHours);
        }

        return new DashboardStatsResponse
        {
            TotalTickets = total,
            OpenTickets = open,
            ClosedTickets = closed,
            AvgResolutionHours = Math.Round(avgHours, 1)
        };
    }

    public async Task<List<TicketChartItem>> GetTicketChartAsync(string period)
    {
        var from = GetDateFrom(period) ?? DateTime.UtcNow.AddMonths(-1);

        // Group by date
        var created = await _context.Tickets
            .Where(t => t.CreatedAt >= from)
            .GroupBy(t => t.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        var closed = await _context.Tickets
            .Where(t => t.ClosedAt != null && t.ClosedAt >= from)
            .GroupBy(t => t.ClosedAt!.Value.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        // Merge into a single list covering all days
        var allDates = new HashSet<DateTime>();
        created.ForEach(c => allDates.Add(c.Date));
        closed.ForEach(c => allDates.Add(c.Date));

        // Fill in missing days
        for (var d = from.Date; d <= DateTime.UtcNow.Date; d = d.AddDays(1))
            allDates.Add(d);

        var createdDict = created.ToDictionary(c => c.Date, c => c.Count);
        var closedDict = closed.ToDictionary(c => c.Date, c => c.Count);

        return allDates
            .OrderBy(d => d)
            .Select(d => new TicketChartItem
            {
                Date = d.ToString("MM/dd"),
                Created = createdDict.GetValueOrDefault(d, 0),
                Closed = closedDict.GetValueOrDefault(d, 0)
            })
            .ToList();
    }

    public async Task<List<EngineerPerformanceItem>> GetEngineerPerformanceAsync(string period)
    {
        var from = GetDateFrom(period);

        var query = _context.Tickets
            .Where(t => t.AssignedToId != null);

        if (from.HasValue)
            query = query.Where(t => t.CreatedAt >= from.Value);

        var grouped = await query
            .GroupBy(t => new { t.AssignedToId, t.AssignedTo!.FullName })
            .Select(g => new
            {
                EngineerId = g.Key.AssignedToId!.Value,
                EngineerName = g.Key.FullName,
                AssignedCount = g.Count(),
                ResolvedCount = g.Count(t => t.Status == TicketStatus.Closed),
                ClosedTickets = g
                    .Where(t => t.Status == TicketStatus.Closed && t.ClosedAt != null)
                    .Select(t => new { t.CreatedAt, t.ClosedAt })
                    .ToList()
            })
            .ToListAsync();

        return grouped.Select(g => new EngineerPerformanceItem
        {
            EngineerId = g.EngineerId,
            EngineerName = g.EngineerName,
            AssignedCount = g.AssignedCount,
            ResolvedCount = g.ResolvedCount,
            AvgResolutionHours = g.ClosedTickets.Count > 0
                ? Math.Round(g.ClosedTickets.Average(t => (t.ClosedAt!.Value - t.CreatedAt).TotalHours), 1)
                : 0
        })
        .OrderByDescending(e => e.ResolvedCount)
        .ToList();
    }

    public async Task<FeedbackSummaryResponse> GetFeedbackSummaryAsync(string period)
    {
        var from = GetDateFrom(period);

        var query = _context.Feedbacks.AsQueryable();
        if (from.HasValue)
            query = query.Where(f => f.CreatedAt >= from.Value);

        var feedbacks = await query
            .Select(f => f.Rating)
            .ToListAsync();

        if (feedbacks.Count == 0)
        {
            return new FeedbackSummaryResponse
            {
                AverageRating = 0,
                TotalCount = 0,
                Distribution = new Dictionary<int, int>
                {
                    { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }
                }
            };
        }

        var distribution = new Dictionary<int, int>
        {
            { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }
        };
        foreach (var rating in feedbacks)
        {
            if (distribution.ContainsKey(rating))
                distribution[rating]++;
        }

        return new FeedbackSummaryResponse
        {
            AverageRating = Math.Round(feedbacks.Average(), 1),
            TotalCount = feedbacks.Count,
            Distribution = distribution
        };
    }

    private static DateTime? GetDateFrom(string period)
    {
        return period.ToLower() switch
        {
            "today" => DateTime.UtcNow.Date,
            "week" => DateTime.UtcNow.AddDays(-7),
            "month" => DateTime.UtcNow.AddMonths(-1),
            "year" => DateTime.UtcNow.AddYears(-1),
            _ => DateTime.UtcNow.AddMonths(-1)
        };
    }
}
