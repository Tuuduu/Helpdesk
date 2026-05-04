using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerStorageConfiguration : IEntityTypeConfiguration<ComputerStorage>
{
    public void Configure(EntityTypeBuilder<ComputerStorage> builder)
    {
        builder.ToTable("computer_storages");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(s => s.Type)
            .HasConversion<string>()
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(s => s.CapacityGb).IsRequired();
        builder.Property(s => s.ModelName).HasMaxLength(200);

        builder.HasOne(s => s.Computer)
            .WithMany(c => c.Storages)
            .HasForeignKey(s => s.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.ComputerId);
    }
}
