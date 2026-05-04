using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerProcessRequestConfiguration : IEntityTypeConfiguration<ComputerProcessRequest>
{
    public void Configure(EntityTypeBuilder<ComputerProcessRequest> builder)
    {
        builder.ToTable("computer_process_requests");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(ProcessRequestStatus.PendingApproval);

        builder.Property(r => r.Description).HasMaxLength(2000).IsRequired();
        builder.Property(r => r.CompletionNote).HasMaxLength(1000);
        builder.Property(r => r.CurrentStepIndex).HasDefaultValue(0);

        builder.HasOne(r => r.Computer)
            .WithMany()
            .HasForeignKey(r => r.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(r => r.RequestedByUser)
            .WithMany()
            .HasForeignKey(r => r.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(r => new { r.ComputerId, r.Type, r.Status });
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
    }
}

public class ProcessStepApprovalConfiguration : IEntityTypeConfiguration<ProcessStepApproval>
{
    public void Configure(EntityTypeBuilder<ProcessStepApproval> builder)
    {
        builder.ToTable("process_step_approvals");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(a => a.Note).HasMaxLength(1000);

        builder.HasOne(a => a.ProcessRequest)
            .WithMany(r => r.StepApprovals)
            .HasForeignKey(a => a.ProcessRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.ActedByUser)
            .WithMany()
            .HasForeignKey(a => a.ActedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => new { a.ProcessRequestId, a.StepOrder });
    }
}

public class ComputerProcessHistoryConfiguration : IEntityTypeConfiguration<ComputerProcessHistory>
{
    public void Configure(EntityTypeBuilder<ComputerProcessHistory> builder)
    {
        builder.ToTable("computer_process_histories");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(h => h.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(h => h.Description).HasMaxLength(2000);
        builder.Property(h => h.Note).HasMaxLength(1000);

        builder.HasOne(h => h.Computer)
            .WithMany()
            .HasForeignKey(h => h.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.ActedByUser)
            .WithMany()
            .HasForeignKey(h => h.ActedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Request)
            .WithMany()
            .HasForeignKey(h => h.RequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => new { h.ComputerId, h.CompletedAt });
    }
}
