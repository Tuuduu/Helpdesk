namespace BishreltHelpdesk.Domain.Entities;

public class ReportTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ColumnsJson { get; set; } = "[]";
    public string? FiltersJson { get; set; }
    public Guid CreatedById { get; set; }

    // Navigation
    public User CreatedBy { get; set; } = null!;
}
