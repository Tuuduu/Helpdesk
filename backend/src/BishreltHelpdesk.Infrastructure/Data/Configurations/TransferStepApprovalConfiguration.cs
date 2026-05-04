using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class TransferStepApprovalConfiguration : IEntityTypeConfiguration<TransferStepApproval>
{
    public void Configure(EntityTypeBuilder<TransferStepApproval> builder)
    {
        builder.ToTable("transfer_step_approvals");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.Note).HasMaxLength(1000);

        builder.HasOne(a => a.Transfer)
            .WithMany(t => t.StepApprovals)
            .HasForeignKey(a => a.TransferId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.ApprovedByUser)
            .WithMany()
            .HasForeignKey(a => a.ApprovedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => new { a.TransferId, a.StepOrder });
    }
}
