using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BishreltHelpdesk.Infrastructure.Data.Configurations;

public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("feedbacks");
        builder.HasKey(f => f.Id);
        builder.Property(f => f.Id).HasDefaultValueSql("gen_random_uuid()");

        builder.Property(f => f.Rating).IsRequired();
        builder.Property(f => f.GuestName).HasMaxLength(200);

        builder.HasOne(f => f.Ticket)
            .WithMany(t => t.Feedbacks)
            .HasForeignKey(f => f.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.SubmittedBy)
            .WithMany(u => u.Feedbacks)
            .HasForeignKey(f => f.SubmittedById)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(f => f.TicketId);
    }
}
