using System.Text;
using BishreltHelpdesk.API.Authorization;
using BishreltHelpdesk.API.Middleware;
using BishreltHelpdesk.Application.Interfaces;
using BishreltHelpdesk.Domain.Enums;
using BishreltHelpdesk.Domain.Interfaces;
using BishreltHelpdesk.Domain.Interfaces.Repositories;
using BishreltHelpdesk.Infrastructure.Data;
using BishreltHelpdesk.Infrastructure.Data.Interceptors;
using BishreltHelpdesk.Infrastructure.Repositories;
using BishreltHelpdesk.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ──────────────────────────────────────────────
// Serilog
// ──────────────────────────────────────────────
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

// ──────────────────────────────────────────────
// DbContext
// ──────────────────────────────────────────────
builder.Services.AddSingleton<AuditableEntityInterceptor>();
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.AddInterceptors(sp.GetRequiredService<AuditableEntityInterceptor>());
});

// ──────────────────────────────────────────────
// Repositories
// ──────────────────────────────────────────────
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<ITicketRepository, TicketRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();
builder.Services.AddScoped<ICompanyRepository, CompanyRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ──────────────────────────────────────────────
// Services
// ──────────────────────────────────────────────
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAboutService, AboutService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IPasswordHashService, PasswordHashService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddHttpContextAccessor();

// ──────────────────────────────────────────────
// Authentication (JWT Bearer)
// ──────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero,
        NameClaimType = "fullName",
        RoleClaimType = "role"
    };
});

// ──────────────────────────────────────────────
// Authorization Policies
// ──────────────────────────────────────────────
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Policies.SuperAdminOnly, policy =>
        policy.RequireClaim("role", UserRole.SuperAdmin.ToString()));

    options.AddPolicy(Policies.AdminOrAbove, policy =>
        policy.RequireClaim("role",
            UserRole.Admin.ToString(),
            UserRole.SuperAdmin.ToString()));

    options.AddPolicy(Policies.Authenticated, policy =>
        policy.RequireAuthenticatedUser());
});

// ──────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ──────────────────────────────────────────────
// Controllers + Swagger
// ──────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Bishrelt Helpdesk API",
        Version = "v1",
        Description = "Бишрэлт Групп Helpdesk системийн API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT токен оруулна уу. Жишээ: eyJhbGciOi..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ══════════════════════════════════════════════
// Build & Configure Pipeline
// ══════════════════════════════════════════════
var app = builder.Build();

// Global exception handler
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Bishrelt Helpdesk API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed database
await DataSeeder.SeedAsync(app.Services);

app.Run();
