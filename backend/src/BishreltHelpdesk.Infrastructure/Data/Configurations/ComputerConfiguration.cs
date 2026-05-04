using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerConfiguration : IEntityTypeConfiguration<Computer>
{
    public void Configure(EntityTypeBuilder<Computer> builder)
    {
        builder.ToTable("computers");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(c => c.AssetCode).HasMaxLength(30).IsRequired();
        builder.HasIndex(c => c.AssetCode).IsUnique();

        builder.Property(c => c.Brand).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Model).HasMaxLength(100).IsRequired();
        builder.Property(c => c.Monitor).HasMaxLength(200);
        builder.Property(c => c.Cpu).HasMaxLength(200).IsRequired();
        builder.Property(c => c.RamGb).IsRequired();
        builder.Property(c => c.Gpu).HasMaxLength(100);

        builder.Property(c => c.DomainName).HasMaxLength(200);
        builder.Property(c => c.Position).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Department).HasMaxLength(200);

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ComputerStatus.Active);

        // Relationships
        builder.HasOne(c => c.Owner)
            .WithMany(u => u.OwnedComputers)
            .HasForeignKey(c => c.OwnerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Company)
            .WithMany()
            .HasForeignKey(c => c.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.HasIndex(c => c.OwnerUserId);
        builder.HasIndex(c => c.CompanyId);
        builder.HasIndex(c => new { c.CompanyId, c.Status });
    }
}
