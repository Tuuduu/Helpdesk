using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class ComputerImageConfiguration : IEntityTypeConfiguration<ComputerImage>
{
    public void Configure(EntityTypeBuilder<ComputerImage> builder)
    {
        builder.ToTable("computer_images");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(i => i.ImageUrl).HasMaxLength(500).IsRequired();
        builder.Property(i => i.IsPrimary).HasDefaultValue(false);

        builder.HasOne(i => i.Computer)
            .WithMany(c => c.Images)
            .HasForeignKey(i => i.ComputerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(i => i.ComputerId);
    }
}
