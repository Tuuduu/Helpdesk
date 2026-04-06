using BishreltHelpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace BishreltHelpdesk.Infrastructure.Data.Interceptors;

public class AuditableEntityInterceptor : SaveChangesInterceptor
{
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        if (context == null) return base.SavingChangesAsync(eventData, result, cancellationToken);

        var now = DateTime.UtcNow;

        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.UpdatedAt = now;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Property(e => e.CreatedAt).IsModified = false;
                    break;
            }
        }

        foreach (var entry in context.ChangeTracker.Entries<TicketHistory>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = now;
        }

        foreach (var entry in context.ChangeTracker.Entries<RefreshToken>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CreatedAt = now;
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
