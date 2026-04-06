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
    }
}
