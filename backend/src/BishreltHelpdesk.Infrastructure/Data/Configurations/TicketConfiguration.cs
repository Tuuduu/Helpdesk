using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> builder)
    {
        builder.ToTable("tickets");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.TicketNumber).HasMaxLength(30).IsRequired();
        builder.HasIndex(t => t.TicketNumber).IsUnique();

        builder.Property(t => t.Title).HasMaxLength(500).IsRequired();
        builder.Property(t => t.Description).IsRequired();
        builder.Property(t => t.FullName).HasMaxLength(200).IsRequired();
        builder.Property(t => t.PhoneNumber).HasMaxLength(50).IsRequired();
        builder.Property(t => t.Position).HasMaxLength(200);
        builder.Property(t => t.Department).HasMaxLength(200);
        builder.Property(t => t.ComputerNumber).HasMaxLength(50);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(TicketStatus.New);

        builder.Property(t => t.Priority)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(TicketPriority.Medium);

        builder.Property(t => t.CallType)
            .HasMaxLength(50)
            .IsRequired();

        // Relationships
        builder.HasOne(t => t.Company)
            .WithMany(c => c.Tickets)
            .HasForeignKey(t => t.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.RequestedBy)
            .WithMany(u => u.RequestedTickets)
            .HasForeignKey(t => t.RequestedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.AssignedTo)
            .WithMany(u => u.AssignedTickets)
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.ClosedBy)
            .WithMany()
            .HasForeignKey(t => t.ClosedById)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(t => new { t.Status, t.CreatedAt });
        builder.HasIndex(t => t.CompanyId);
        builder.HasIndex(t => new { t.AssignedToId, t.Status });
        builder.HasIndex(t => t.RequestedById);
    }
}
