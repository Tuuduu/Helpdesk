using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class VendorTypeConfiguration : IEntityTypeConfiguration<VendorType>
{
    public void Configure(EntityTypeBuilder<VendorType> builder)
    {
        builder.ToTable("vendor_types");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(t => t.Name).HasMaxLength(120).IsRequired();
        builder.Property(t => t.Description).HasMaxLength(500);
        builder.Property(t => t.SortOrder).HasDefaultValue(0);
        builder.Property(t => t.IsActive).HasDefaultValue(true);

        builder.HasIndex(t => t.Name).IsUnique();
    }
}
