namespace BishreltHelpdesk.Application.DTOs.Departments;

public class DepartmentResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
}

public class UpdateDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
}
