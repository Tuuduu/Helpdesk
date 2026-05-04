using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerTransferRequestConfiguration : IEntityTypeConfiguration<ComputerTransferRequest>
{
    public void Configure(EntityTypeBuilder<ComputerTransferRequest> builder)
    {
        builder.ToTable("computer_transfer_requests");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .HasDefaultValue(TransferRequestStatus.PendingApproval);

        builder.Property(r => r.CurrentStepIndex).HasDefaultValue(0);

        builder.Property(r => r.StorekeeperNote).HasMaxLength(1000);
        builder.Property(r => r.ReceiverNote).HasMaxLength(1000);
        builder.Property(r => r.Reason).HasMaxLength(1000).IsRequired();

        // Computer FK — cascade so a hard-deleted computer also drops its pending requests
        builder.HasOne(r => r.Computer)
            .WithMany(c => c.TransferRequests)
            .HasForeignKey(r => r.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        // User FKs — Restrict so we don't lose audit integrity by user deletion
        builder.HasOne(r => r.FromUser)
            .WithMany()
            .HasForeignKey(r => r.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.ToUser)
            .WithMany()
            .HasForeignKey(r => r.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.RequestedByUser)
            .WithMany()
            .HasForeignKey(r => r.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(r => r.Storekeeper)
            .WithMany()
            .HasForeignKey(r => r.StorekeeperId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(r => r.ComputerId);
        builder.HasIndex(r => new { r.Status, r.CreatedAt });
        builder.HasIndex(r => r.ToUserId);
        builder.HasIndex(r => r.FromUserId);
    }
}
