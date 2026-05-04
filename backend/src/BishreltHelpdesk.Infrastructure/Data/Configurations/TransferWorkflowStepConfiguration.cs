using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class TransferWorkflowStepConfiguration : IEntityTypeConfiguration<TransferWorkflowStep>
{
    public void Configure(EntityTypeBuilder<TransferWorkflowStep> builder)
    {
        builder.ToTable("transfer_workflow_steps");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.Name).HasMaxLength(150).IsRequired();
        builder.Property(s => s.Order).IsRequired();

        builder.Property(s => s.WorkflowType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(BishreltHelpdesk.Domain.Enums.WorkflowType.Transfer);

        builder.HasOne(s => s.Company)
            .WithMany()
            .HasForeignKey(s => s.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => new { s.CompanyId, s.WorkflowType, s.Order });
    }
}

public class TransferWorkflowStepApproverConfiguration : IEntityTypeConfiguration<TransferWorkflowStepApprover>
{
    public void Configure(EntityTypeBuilder<TransferWorkflowStepApprover> builder)
    {
        builder.ToTable("transfer_workflow_step_approvers");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.HasOne(a => a.Step)
            .WithMany(s => s.Approvers)
            .HasForeignKey(a => a.StepId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => new { a.StepId, a.UserId }).IsUnique();
    }
}
