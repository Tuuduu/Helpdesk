using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerAccessoryConfiguration : IEntityTypeConfiguration<ComputerAccessory>
{
    public void Configure(EntityTypeBuilder<ComputerAccessory> builder)
    {
        builder.ToTable("computer_accessories");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(a => a.Name).HasMaxLength(150).IsRequired();
        builder.Property(a => a.Note).HasMaxLength(500);

        builder.HasOne(a => a.Computer)
            .WithMany(c => c.Accessories)
            .HasForeignKey(a => a.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(a => a.ComputerId);
    }
}
