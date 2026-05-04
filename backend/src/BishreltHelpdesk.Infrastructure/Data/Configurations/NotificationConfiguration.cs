using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).HasDefaultValueSql("gen_random_uuid()");
        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Message).IsRequired().HasMaxLength(500);
        builder.Property(n => n.Type).IsRequired().HasMaxLength(50);
        builder.Property(n => n.IsRead).HasDefaultValue(false);

        builder.HasOne(n => n.Recipient)
            .WithMany()
            .HasForeignKey(n => n.RecipientId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.RelatedTicket)
            .WithMany()
            .HasForeignKey(n => n.RelatedTicketId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.RelatedTransfer)
            .WithMany()
            .HasForeignKey(n => n.RelatedTransferId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(n => new { n.RecipientId, n.IsRead });
        builder.HasIndex(n => n.CreatedAt);
    }
}
