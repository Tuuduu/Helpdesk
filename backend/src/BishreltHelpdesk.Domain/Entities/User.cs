using BishreltHelpdesk.Domain.Enums;

namespace BishreltHelpdesk.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? Position { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ComputerNumber { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsGlobalApprover { get; set; } = false;

    // Navigation
    public Company Company { get; set; } = null!;
    public Department? Department { get; set; }
    public ICollection<Ticket> RequestedTickets { get; set; } = new List<Ticket>();
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Computer> OwnedComputers { get; set; } = new List<Computer>();
}
