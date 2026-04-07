using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class AppConfigConfiguration : IEntityTypeConfiguration<AppConfig>
{
    public void Configure(EntityTypeBuilder<AppConfig> builder)
    {
        builder.ToTable("app_configs");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(c => c.Key).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Value).IsRequired().HasMaxLength(500);
        builder.HasIndex(c => c.Key).IsUnique();
    }
}
