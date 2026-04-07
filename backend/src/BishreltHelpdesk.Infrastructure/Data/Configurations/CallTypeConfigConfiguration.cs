using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class CallTypeConfigConfiguration : IEntityTypeConfiguration<CallTypeConfig>
{
    public void Configure(EntityTypeBuilder<CallTypeConfig> builder)
    {
        builder.ToTable("call_type_configs");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(c => c.Code).HasMaxLength(50).IsRequired();
        builder.Property(c => c.Label).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(500);
        builder.Property(c => c.DefaultPriority).HasMaxLength(20).HasDefaultValue("Medium");
        builder.HasIndex(c => c.Code).IsUnique();
    }
}
