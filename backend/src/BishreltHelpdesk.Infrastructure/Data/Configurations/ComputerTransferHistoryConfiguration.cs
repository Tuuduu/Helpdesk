using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerTransferHistoryConfiguration : IEntityTypeConfiguration<ComputerTransferHistory>
{
    public void Configure(EntityTypeBuilder<ComputerTransferHistory> builder)
    {
        builder.ToTable("computer_transfer_histories");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(h => h.Note).HasMaxLength(1000);
        builder.Property(h => h.TransferredAt).IsRequired();

        builder.HasOne(h => h.Computer)
            .WithMany(c => c.TransferHistories)
            .HasForeignKey(h => h.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.FromUser)
            .WithMany()
            .HasForeignKey(h => h.FromUserId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(h => h.ToUser)
            .WithMany()
            .HasForeignKey(h => h.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.ApprovedByStorekeeper)
            .WithMany()
            .HasForeignKey(h => h.ApprovedByStorekeeperId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(h => h.Request)
            .WithMany()
            .HasForeignKey(h => h.RequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => new { h.ComputerId, h.TransferredAt });
    }
}
