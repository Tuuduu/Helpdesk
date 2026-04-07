using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Entities;
using BishreltHelpdesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace BishreltHelpdesk.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHashService = scope.ServiceProvider.GetRequiredService<IPasswordHashService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        try
        {
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrated successfully");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error migrating database");
            throw;
        }

        // Seed CallTypeConfigs independently (may run after initial seed)
        if (!await context.CallTypeConfigs.AnyAsync())
        {
            var callTypes = new[]
            {
                new CallTypeConfig { Id = Guid.NewGuid(), Code = "PhoneCall", Label = "Утасны дуудлага", IsActive = true, SortOrder = 0 },
                new CallTypeConfig { Id = Guid.NewGuid(), Code = "Email",     Label = "Имэйл",           IsActive = true, SortOrder = 1 },
                new CallTypeConfig { Id = Guid.NewGuid(), Code = "WalkIn",    Label = "Биечлэн",         IsActive = true, SortOrder = 2 },
                new CallTypeConfig { Id = Guid.NewGuid(), Code = "Remote",    Label = "Зайнаас",         IsActive = true, SortOrder = 3 },
            };
            await context.CallTypeConfigs.AddRangeAsync(callTypes);
            await context.SaveChangesAsync();
            logger.LogInformation("CallTypeConfigs seeded");
        }

        if (await context.Companies.AnyAsync())
        {
            logger.LogInformation("Database already seeded");
            return;
        }

        logger.LogInformation("Seeding database...");

        // Seed companies
        var bishrelt = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Бишрэлт Групп",
            Description = "Бишрэлт Групп ХХК",
            IsActive = true
        };

        var sampleCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Жишээ Компани",
            Description = "Жишээ компани",
            IsActive = true
        };

        await context.Companies.AddRangeAsync(bishrelt, sampleCompany);

        // Seed SuperAdmin user
        var superAdmin = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@bishrelt.mn",
            PasswordHash = passwordHashService.Hash("Admin@123"),
            FullName = "Систем Админ",
            CompanyId = bishrelt.Id,
            Position = "IT Administrator",
            Role = UserRole.SuperAdmin,
            IsActive = true
        };

        // Seed an Admin user
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = "support@bishrelt.mn",
            PasswordHash = passwordHashService.Hash("Admin@123"),
            FullName = "Тусламж Инженер",
            CompanyId = bishrelt.Id,
            Position = "Support Engineer",
            Role = UserRole.Admin,
            IsActive = true
        };

        // Seed a regular user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@bishrelt.mn",
            PasswordHash = passwordHashService.Hash("User@123"),
            FullName = "Хэрэглэгч Нэг",
            CompanyId = sampleCompany.Id,
            Position = "Менежер",
            Role = UserRole.User,
            IsActive = true
        };

        await context.Users.AddRangeAsync(superAdmin, admin, user);

        // Seed about content
        var about = new AboutContent
        {
            Id = Guid.NewGuid(),
            Content = "Бишрэлт Групп-ийн дотоод Helpdesk систем. Техникийн асуудал, хүсэлтүүдийг бүртгэх, хянах, шийдвэрлэх зориулалттай."
        };

        await context.AboutContents.AddAsync(about);

        await context.SaveChangesAsync();
        logger.LogInformation("Database seeded successfully");

        await SeedBrandingAsync(context);
    }

    private static async Task SeedBrandingAsync(AppDbContext context)
    {
        if (!await context.AppConfigs.AnyAsync())
        {
            var now = DateTime.UtcNow;
            await context.AppConfigs.AddRangeAsync(
                new AppConfig { Id = Guid.NewGuid(), Key = "company_name",     Value = "BISHRELT", CreatedAt = now, UpdatedAt = now },
                new AppConfig { Id = Guid.NewGuid(), Key = "company_subtitle", Value = "GROUP",    CreatedAt = now, UpdatedAt = now },
                new AppConfig { Id = Guid.NewGuid(), Key = "logo_text",        Value = "BG",       CreatedAt = now, UpdatedAt = now }
            );
            await context.SaveChangesAsync();
        }
    }
}
