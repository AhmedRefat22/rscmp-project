using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using RSCMP.Application.Interfaces;
using RSCMP.Application.Mappings;
using RSCMP.Application.Validators;
using RSCMP.Domain.Entities;
using RSCMP.Domain.Enums;
using RSCMP.Domain.Interfaces;
using RSCMP.Infrastructure.Data;
using RSCMP.Infrastructure.Repositories;
using RSCMP.Infrastructure.Services;
using RSCMP.API.Converters;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (builder.Configuration.GetValue<bool>("UsePostgres"))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// Add Identity
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Add JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
        ClockSkew = TimeSpan.Zero
    };
});

// Add Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ChairmanOnly", policy => policy.RequireRole("Chairman", "Admin"));
    options.AddPolicy("ReviewerOnly", policy => policy.RequireRole("Reviewer", "Chairman", "Admin"));
    options.AddPolicy("Authenticated", policy => policy.RequireAuthenticatedUser());
});

// Add Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User?.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Add CORS
var corsOrigins = builder.Configuration.GetSection("CorsOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add Localization
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

// Add Controllers with Validation
builder.Services.AddControllers(options =>
    {
        // Log ModelState errors for debugging
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new LanguageJsonConverter());
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    })
    .AddDataAnnotationsLocalization()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );
            
            Log.Warning("Validation errors: {@Errors}", errors);
            
            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new 
            {
                message = "Validation failed | فشل التحقق",
                errors = errors
            });
        };
    });

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Add HttpContextAccessor
builder.Services.AddHttpContextAccessor();

// Register Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IConferenceRepository, ConferenceRepository>();
builder.Services.AddScoped<IResearchRepository, ResearchRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

// Register FileStorageService
var fileStorageSettings = builder.Configuration.GetSection("FileStorage");
builder.Services.AddSingleton<IFileStorageService>(sp => 
    new FileStorageService(
        fileStorageSettings["BasePath"] ?? "./uploads",
        fileStorageSettings["BaseUrl"] ?? "https://localhost:7000/files"));

// Register EmailService
var emailSettings = builder.Configuration.GetSection("EmailSettings");
builder.Services.AddSingleton<IEmailService>(sp =>
    new EmailService(
        emailSettings["SmtpHost"] ?? "smtp.example.com",
        int.Parse(emailSettings["SmtpPort"] ?? "587"),
        emailSettings["FromEmail"] ?? "noreply@rscmp.com",
        emailSettings["FromName"] ?? "RSCMP Platform"));

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RSCMP API",
        Version = "v1",
        Description = "Research & Scientific Conference Management Platform API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
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

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';");
    
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers.Append("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    
    await next();
});

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRateLimiter();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseSerilogRequestLogging();

app.MapControllers();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        
        // Database has been reset with Chairman@gmail.com and Reviewer@gmail.com
        // Uncomment below ONLY if you need to reset the database again
        // await context.Database.EnsureDeletedAsync();
        // Log.Information("Database deleted for fresh seed data");
        
        await context.Database.MigrateAsync();
        Log.Information("Database migrated successfully");
        
        await SeedDataAsync(userManager, roleManager, context);
    }
    catch (Exception ex)
    {
        Log.Fatal(ex, "An error occurred while migrating or seeding the database");
    }
}

app.Run();

static async Task SeedDataAsync(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, ApplicationDbContext context)
{
    // Seed Roles
    string[] roles = { "Admin", "Chairman", "Reviewer", "Public" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(new ApplicationRole
            {
                Name = role,
                DescriptionEn = $"{role} role",
                DescriptionAr = $"دور {role}"
            });
        }
    }

    // Seed Admin User
    var adminEmail = "admin@rscmp.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullNameEn = "System Administrator",
            FullNameAr = "مدير النظام",
            EmailConfirmed = true,
            PreferredLanguage = Language.English
        };
        
        var result = await userManager.CreateAsync(admin, "Admin@123456");
        if (!result.Succeeded)
        {
             // Log errors if creation fails, or throw exception
             // In production, handle this more gracefully
             throw new Exception($"Failed to create admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRolesAsync(admin, new[] { "Admin", "Chairman", "Reviewer", "Public" });
    }

    // Seed Custom Admin User (Requested by User)
    var customAdminEmail = "Ahmed@gmail.com";
    if (await userManager.FindByEmailAsync(customAdminEmail) == null)
    {
        var customAdmin = new ApplicationUser
        {
            UserName = customAdminEmail,
            Email = customAdminEmail,
            FullNameEn = "Ahmed Refat",
            FullNameAr = "أحمد رفعت",
            EmailConfirmed = true,
            PreferredLanguage = Language.Arabic
        };
        
        var result = await userManager.CreateAsync(customAdmin, "123456");
        if (!result.Succeeded)
        {
             throw new Exception($"Failed to create custom admin user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRolesAsync(customAdmin, new[] { "Admin", "Chairman", "Reviewer", "Public" });
    }

    // Seed Additional Admin User (Requested by User)
    var newAdminEmail = "Admin@gmail.com";
    if (await userManager.FindByEmailAsync(newAdminEmail) == null)
    {
        var newAdmin = new ApplicationUser
        {
            UserName = newAdminEmail,
            Email = newAdminEmail,
            FullNameEn = "System Admin",
            FullNameAr = "مدير النظام",
            EmailConfirmed = true,
            PreferredLanguage = Language.Arabic
        };
        
        var result = await userManager.CreateAsync(newAdmin, "123456");
        if (result.Succeeded)
        {
            await userManager.AddToRolesAsync(newAdmin, new[] { "Admin", "Chairman", "Reviewer", "Public" });
        }
    }

    // Seed Custom User (Requested by User)
    var moEmail = "Mo@gmail.com";
    var moUser = await userManager.FindByEmailAsync(moEmail);
    if (moUser == null)
    {
        moUser = new ApplicationUser
        {
            UserName = moEmail,
            Email = moEmail,
            FullNameEn = "Mohamed",
            FullNameAr = "محمد",
            EmailConfirmed = true,
            PreferredLanguage = Language.Arabic
        };
        
        var result = await userManager.CreateAsync(moUser, "123456");
        if (!result.Succeeded)
        {
             throw new Exception($"Failed to create custom user Mo: {string.Join(", ", result.Errors.Select(e => e.Description))}");
        }
        
        await userManager.AddToRolesAsync(moUser, new[] { "Admin", "Chairman", "Reviewer", "Public" });
    }

    // Seed Chairman User
    var chairmanEmail = "chairman@rscmp.com";
    if (await userManager.FindByEmailAsync(chairmanEmail) == null)
    {
        var chairman = new ApplicationUser
        {
            UserName = chairmanEmail,
            Email = chairmanEmail,
            FullNameEn = "Conference Chairman",
            FullNameAr = "رئيس المؤتمر",
            Institution = "Cairo University",
            EmailConfirmed = true,
            PreferredLanguage = Language.Arabic
        };
        
        await userManager.CreateAsync(chairman, "Chairman@123456");
        await userManager.AddToRolesAsync(chairman, new[] { "Chairman", "Reviewer", "Public" });
    }

    // Seed Reviewer User (reviewer@rscmp.com)
    var reviewerEmail = "reviewer@rscmp.com";
    if (await userManager.FindByEmailAsync(reviewerEmail) == null)
    {
        var reviewer = new ApplicationUser
        {
            UserName = reviewerEmail,
            Email = reviewerEmail,
            FullNameEn = "Research Reviewer",
            FullNameAr = "مراجع الأبحاث",
            Institution = "Alexandria University",
            EmailConfirmed = true,
            PreferredLanguage = Language.English
        };
        
        await userManager.CreateAsync(reviewer, "Reviewer@123456");
        await userManager.AddToRolesAsync(reviewer, new[] { "Reviewer", "Public" });
    }

    // Seed Reviewer User (Reviewer@gmail.com)
    var reviewerGmailEmail = "Reviewer@gmail.com";
    if (await userManager.FindByEmailAsync(reviewerGmailEmail) == null)
    {
        var reviewerGmail = new ApplicationUser
        {
            UserName = reviewerGmailEmail,
            Email = reviewerGmailEmail,
            FullNameEn = "Reviewer",
            FullNameAr = "المراجع",
            Institution = "Cairo University",
            EmailConfirmed = true,
            PreferredLanguage = Language.Arabic
        };
        
        var result = await userManager.CreateAsync(reviewerGmail, "123456");
        if (result.Succeeded)
        {
            await userManager.AddToRolesAsync(reviewerGmail, new[] { "Reviewer", "Public" });
        }
    }

    // Seed Chairman User (Chairman@gmail.com)
    var chairmanGmailEmail = "Chairman@gmail.com";
    if (await userManager.FindByEmailAsync(chairmanGmailEmail) == null)
    {
        var chairmanGmail = new ApplicationUser
        {
            UserName = chairmanGmailEmail,
            Email = chairmanGmailEmail,
            FullNameEn = "Chairman",
            FullNameAr = "رئيس اللجنة",
            Institution = "Cairo University",
            EmailConfirmed = true,
            PreferredLanguage = Language.Arabic
        };
        
        var result = await userManager.CreateAsync(chairmanGmail, "123456");
        if (result.Succeeded)
        {
            await userManager.AddToRolesAsync(chairmanGmail, new[] { "Chairman", "Public" });
        }
    }

    // Seed Regular User
    var userEmail = "user@rscmp.com";
    if (await userManager.FindByEmailAsync(userEmail) == null)
    {
        var user = new ApplicationUser
        {
            UserName = userEmail,
            Email = userEmail,
            FullNameEn = "John Researcher",
            FullNameAr = "جون الباحث",
            Institution = "Ain Shams University",
            EmailConfirmed = true,
            PreferredLanguage = Language.English
        };
        
        await userManager.CreateAsync(user, "User@123456");
        await userManager.AddToRolesAsync(user, new[] { "Public" });
    }

    // Seed System Settings
    if (!await context.SystemSettings.AnyAsync())
    {
        context.SystemSettings.AddRange(
            new SystemSetting { Key = "DefaultLanguage", Value = "en", Category = "Localization", DescriptionEn = "Default system language", DescriptionAr = "اللغة الافتراضية للنظام", IsPublic = true },
            new SystemSetting { Key = "SiteName", Value = "RSCMP", Category = "General", DescriptionEn = "Platform name", DescriptionAr = "اسم المنصة", IsPublic = true },
            new SystemSetting { Key = "SiteNameAr", Value = "منصة إدارة المؤتمرات العلمية", Category = "General", DescriptionEn = "Platform name in Arabic", DescriptionAr = "اسم المنصة بالعربية", IsPublic = true },
            new SystemSetting { Key = "MaxFileSize", Value = "10485760", Category = "Uploads", DescriptionEn = "Maximum file size in bytes (10MB)", DescriptionAr = "الحد الأقصى لحجم الملف بالبايت", IsPublic = false },
            new SystemSetting { Key = "AdminEmail", Value = "admin@rscmp.com", Category = "Contact", DescriptionEn = "Admin contact email", DescriptionAr = "البريد الإلكتروني للمسؤول", IsPublic = true }
        );
        await context.SaveChangesAsync();
    }

    // Seed Sample Conference
    if (!await context.Conferences.AnyAsync())
    {
        var conference = new Conference
        {
            NameEn = "International Conference on Scientific Research 2026",
            NameAr = "المؤتمر الدولي للبحث العلمي 2026",
            DescriptionEn = "A premier conference bringing together researchers from around the world to share their latest findings and innovations.",
            DescriptionAr = "مؤتمر رائد يجمع الباحثين من جميع أنحاء العالم لمشاركة أحدث نتائجهم وابتكاراتهم.",
            Location = "Cairo, Egypt",
            Website = "https://conference.rscmp.com",
            StartDate = new DateTime(2026, 6, 15),
            EndDate = new DateTime(2026, 6, 18),
            SubmissionDeadline = new DateTime(2026, 4, 15),
            ReviewDeadline = new DateTime(2026, 5, 15),
            IsActive = true,
            AcceptingSubmissions = true,
            ContactEmail = "conference@rscmp.com"
        };
        context.Conferences.Add(conference);

        // Add Review Criteria
        context.ReviewCriteria.AddRange(
            new ReviewCriteria { ConferenceId = conference.Id, NameEn = "Originality", NameAr = "أصالة العمل", DescriptionEn = "Novelty and originality of the work", DescriptionAr = "حداثة وأصالة العمل", MaxScore = 10, MinScore = 1, Order = 1 },
            new ReviewCriteria { ConferenceId = conference.Id, NameEn = "Scientific Value", NameAr = "القيمة العلمية", DescriptionEn = "Scientific value and contribution", DescriptionAr = "القيمة العلمية والمساهمة", MaxScore = 10, MinScore = 1, Order = 2 },
            new ReviewCriteria { ConferenceId = conference.Id, NameEn = "Relevance", NameAr = "مدى ارتباط البحث بالموضوع", DescriptionEn = "Relevance of the research to the topic", DescriptionAr = "مدى ارتباط البحث بالموضوع", MaxScore = 10, MinScore = 1, Order = 3 }
        );

        await context.SaveChangesAsync();
    }
}
