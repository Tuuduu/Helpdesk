using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BishreltHelpdesk.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<CallTypeConfig> CallTypeConfigs => Set<CallTypeConfig>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketHistory> TicketHistories => Set<TicketHistory>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<AboutContent> AboutContents => Set<AboutContent>();
    public DbSet<ReportTemplate> ReportTemplates => Set<ReportTemplate>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AppConfig> AppConfigs => Set<AppConfig>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Computer> Computers => Set<Computer>();
    public DbSet<ComputerStorage> ComputerStorages => Set<ComputerStorage>();
    public DbSet<ComputerImage> ComputerImages => Set<ComputerImage>();
    public DbSet<ComputerMacAddress> ComputerMacAddresses => Set<ComputerMacAddress>();
    public DbSet<ComputerAccessory> ComputerAccessories => Set<ComputerAccessory>();
    public DbSet<ComputerTransferRequest> ComputerTransferRequests => Set<ComputerTransferRequest>();
    public DbSet<ComputerTransferHistory> ComputerTransferHistories => Set<ComputerTransferHistory>();
    public DbSet<TransferWorkflowStep> TransferWorkflowSteps => Set<TransferWorkflowStep>();
    public DbSet<TransferWorkflowStepApprover> TransferWorkflowStepApprovers => Set<TransferWorkflowStepApprover>();
    public DbSet<TransferStepApproval> TransferStepApprovals => Set<TransferStepApproval>();
    public DbSet<ComputerProcessRequest> ComputerProcessRequests => Set<ComputerProcessRequest>();
    public DbSet<ProcessStepApproval> ProcessStepApprovals => Set<ProcessStepApproval>();
    public DbSet<ComputerProcessHistory> ComputerProcessHistories => Set<ComputerProcessHistory>();
    public DbSet<VendorType> VendorTypes => Set<VendorType>();
    public DbSet<VendorContact> VendorContacts => Set<VendorContact>();
    public DbSet<Announcement> Announcements => Set<Announcement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
