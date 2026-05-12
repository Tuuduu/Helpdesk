using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class VendorContactConfiguration : IEntityTypeConfiguration<VendorContact>
{
    public void Configure(EntityTypeBuilder<VendorContact> builder)
    {
        builder.ToTable("vendor_contacts");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(v => v.CompanyName).HasMaxLength(200).IsRequired();
        builder.Property(v => v.AccountManager).HasMaxLength(150);
        builder.Property(v => v.Phone).HasMaxLength(50);
        builder.Property(v => v.Email).HasMaxLength(150);
        builder.Property(v => v.Description).HasMaxLength(1000);
        builder.Property(v => v.IsActive).HasDefaultValue(true);

        builder.HasOne(v => v.VendorType)
            .WithMany(t => t.Vendors)
            .HasForeignKey(v => v.VendorTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(v => v.VendorTypeId);
        builder.HasIndex(v => v.CompanyName);
    }
}
