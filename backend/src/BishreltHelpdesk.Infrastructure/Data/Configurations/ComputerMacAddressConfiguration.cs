using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerMacAddressConfiguration : IEntityTypeConfiguration<ComputerMacAddress>
{
    public void Configure(EntityTypeBuilder<ComputerMacAddress> builder)
    {
        builder.ToTable("computer_mac_addresses");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(m => m.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(m => m.Address).HasMaxLength(17).IsRequired();
        builder.HasIndex(m => m.Address).IsUnique();

        builder.Property(m => m.Label).HasMaxLength(100);
        builder.Property(m => m.IsPrimary).HasDefaultValue(false);

        builder.HasOne(m => m.Computer)
            .WithMany(c => c.MacAddresses)
            .HasForeignKey(m => m.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.ComputerId);
    }
}
