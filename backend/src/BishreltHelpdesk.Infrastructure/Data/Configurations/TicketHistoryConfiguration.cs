using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class TicketHistoryConfiguration : IEntityTypeConfiguration<TicketHistory>
{
    public void Configure(EntityTypeBuilder<TicketHistory> builder)
    {
        builder.ToTable("ticket_histories");
        builder.HasKey(h => h.Id);
        builder.Property(h => h.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(h => h.Action).HasMaxLength(100).IsRequired();
        builder.Property(h => h.FromValue).HasMaxLength(100);
        builder.Property(h => h.ToValue).HasMaxLength(100);

        builder.HasOne(h => h.Ticket)
            .WithMany(t => t.History)
            .HasForeignKey(h => h.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(h => h.PerformedBy)
            .WithMany()
            .HasForeignKey(h => h.PerformedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(h => new { h.TicketId, h.CreatedAt });
    }
}
