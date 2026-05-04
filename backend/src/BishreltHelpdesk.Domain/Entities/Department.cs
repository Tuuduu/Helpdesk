namespace BishreltHelpdesk.Domain.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }

    // Navigation
    public Company Company { get; set; } = null!;
    public ICollection<User> Users { get; set; } = new List<User>();
}
