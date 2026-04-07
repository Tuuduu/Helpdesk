using BishreltHelpdesk.Application.DTOs.Reports;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Infrastructure.Data;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _context;

    public ReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ReportSummary> GetPreviewAsync(ReportFilterRequest filter)
    {
        var rows = await QueryRows(filter);

        var closed = rows.Where(r => r.Status == "Closed").ToList();
        var avgHours = closed.Count > 0 && closed.Any(r => r.ResolutionHours.HasValue)
            ? Math.Round(closed.Where(r => r.ResolutionHours.HasValue).Average(r => r.ResolutionHours!.Value), 1)
            : 0;

        return new ReportSummary
        {
            TotalTickets = rows.Count,
            OpenTickets = rows.Count(r => r.Status != "Closed"),
            ClosedTickets = closed.Count,
            AvgResolutionHours = avgHours,
            Rows = rows
        };
    }

    public async Task<byte[]> ExportExcelAsync(ReportFilterRequest filter)
    {
        var rows = await QueryRows(filter);

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Тайлан");

        // Header style
        var headerRow = 1;
        var headers = new[]
        {
            "Дугаар", "Гарчиг", "Компани", "Хүсэлт гаргагч", "Утас",
            "Дуудлагын төрөл", "Төлөв", "Зэрэглэл", "Хариуцагч",
            "Үүсгэсэн", "Хаасан", "Шийдвэрлэсэн (цаг)"
        };

        for (var i = 0; i < headers.Length; i++)
        {
            var cell = ws.Cell(headerRow, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#2D2C70");
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        // Data rows
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var r = i + 2;
            ws.Cell(r, 1).Value = row.TicketNumber;
            ws.Cell(r, 2).Value = row.Title;
            ws.Cell(r, 3).Value = row.CompanyName;
            ws.Cell(r, 4).Value = row.RequesterName;
            ws.Cell(r, 5).Value = row.PhoneNumber;
            ws.Cell(r, 6).Value = TranslateCallType(row.CallType);
            ws.Cell(r, 7).Value = TranslateStatus(row.Status);
            ws.Cell(r, 8).Value = TranslatePriority(row.Priority);
            ws.Cell(r, 9).Value = row.AssignedTo ?? "";
            ws.Cell(r, 10).Value = row.CreatedAt.ToString("yyyy-MM-dd HH:mm");
            ws.Cell(r, 11).Value = row.ClosedAt?.ToString("yyyy-MM-dd HH:mm") ?? "";
            ws.Cell(r, 12).Value = row.ResolutionHours?.ToString("F1") ?? "";
        }

        // Summary row
        var sumRow = rows.Count + 3;
        ws.Cell(sumRow, 1).Value = "Нийт:";
        ws.Cell(sumRow, 1).Style.Font.Bold = true;
        ws.Cell(sumRow, 2).Value = rows.Count;
        ws.Cell(sumRow, 2).Style.Font.Bold = true;

        // Auto-fit columns
        ws.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private async Task<List<ReportRow>> QueryRows(ReportFilterRequest filter)
    {
        var query = _context.Tickets
            .Include(t => t.Company)
            .Include(t => t.AssignedTo)
            .AsQueryable();

        if (filter.DateFrom.HasValue)
        {
            var from = DateTime.SpecifyKind(filter.DateFrom.Value.Date, DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt >= from);
        }

        if (filter.DateTo.HasValue)
        {
            var to = DateTime.SpecifyKind(filter.DateTo.Value.Date.AddDays(1), DateTimeKind.Utc);
            query = query.Where(t => t.CreatedAt < to);
        }

        if (filter.EngineerId.HasValue)
            query = query.Where(t => t.AssignedToId == filter.EngineerId.Value);

        if (filter.CompanyId.HasValue)
            query = query.Where(t => t.CompanyId == filter.CompanyId.Value);

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tickets.Select(t => new ReportRow
        {
            TicketNumber = t.TicketNumber,
            Title = t.Title,
            CompanyName = t.Company?.Name ?? "",
            RequesterName = t.FullName,
            PhoneNumber = t.PhoneNumber,
            CallType = t.CallType.ToString(),
            Status = t.Status.ToString(),
            Priority = t.Priority.ToString(),
            AssignedTo = t.AssignedTo?.FullName,
            CreatedAt = t.CreatedAt,
            ClosedAt = t.ClosedAt,
            ResolutionHours = t.ClosedAt.HasValue
                ? Math.Round((t.ClosedAt.Value - t.CreatedAt).TotalHours, 1)
                : null
        }).ToList();
    }

    private static string TranslateStatus(string status) => status switch
    {
        "New" => "Шинэ",
        "Accepted" => "Хүлээн авсан",
        "InProgress" => "Шийдвэрлэж байна",
        "Closed" => "Хаагдсан",
        _ => status
    };

    private static string TranslatePriority(string priority) => priority switch
    {
        "Low" => "Бага",
        "Medium" => "Дунд",
        "High" => "Өндөр",
        "Urgent" => "Яаралтай",
        _ => priority
    };

    private static string TranslateCallType(string callType) => callType switch
    {
        "PhoneCall" => "Утасны дуудлага",
        "Email" => "Имэйл",
        "WalkIn" => "Биечлэн",
        "Remote" => "Зайнаас",
        _ => callType
    };
}
