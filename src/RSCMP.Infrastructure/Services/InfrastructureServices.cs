using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using RSCMP.Domain.Entities;
using RSCMP.Domain.Interfaces;
using RSCMP.Infrastructure.Data;

namespace RSCMP.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly string _baseUrl;

    public FileStorageService(string basePath, string baseUrl)
    {
        _basePath = basePath;
        _baseUrl = baseUrl;
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder = "uploads", string[]? allowedTypes = null)
    {
        // Validate file type if specified
        if (allowedTypes != null && allowedTypes.Length > 0)
        {
            if (!allowedTypes.Contains(contentType, StringComparer.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Invalid file type. Allowed: {string.Join(", ", allowedTypes)} | نوع الملف غير مسموح");
        }


        var folderPath = Path.Combine(_basePath, folder);
        Directory.CreateDirectory(folderPath);

        var uniqueFileName = $"{Guid.NewGuid()}_{DateTime.UtcNow:yyyyMMddHHmmss}_{SanitizeFileName(fileName)}";
        var filePath = Path.Combine(folderPath, uniqueFileName);

        using var fileStreamOut = new FileStream(filePath, FileMode.Create);
        await fileStream.CopyToAsync(fileStreamOut);

        return Path.Combine(folder, uniqueFileName).Replace("\\", "/");
    }

    public async Task<Stream?> DownloadFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath);
        if (!File.Exists(fullPath))
            return null;

        var memoryStream = new MemoryStream();
        using var fileStream = new FileStream(fullPath, FileMode.Open, FileAccess.Read);
        await fileStream.CopyToAsync(memoryStream);
        memoryStream.Position = 0;
        return memoryStream;
    }

    public Task<bool> DeleteFileAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }

    public Task<bool> FileExistsAsync(string filePath)
    {
        var fullPath = Path.Combine(_basePath, filePath);
        return Task.FromResult(File.Exists(fullPath));
    }

    public Task<string> GetFileUrlAsync(string filePath)
    {
        return Task.FromResult($"{_baseUrl}/{filePath}");
    }

    public string GetFileChecksum(Stream fileStream)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(fileStream);
        fileStream.Position = 0;
        return Convert.ToHexString(hash);
    }

    private static string SanitizeFileName(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());
        return sanitized.Length > 100 ? sanitized[..100] : sanitized;
    }
}

public class AuditService : IAuditService
{
    private readonly ApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(
        ApplicationDbContext context,
        ICurrentUserService currentUserService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _currentUserService = currentUserService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(string action, string entityType, Guid? entityId = null, object? oldValues = null, object? newValues = null, string? additionalInfo = null)
    {
        try
        {
            var httpContext = _httpContextAccessor.HttpContext;
            
            // Only set UserId if the user is actually authenticated
            Guid? userId = _currentUserService.IsAuthenticated ? _currentUserService.UserId : null;
            
            var auditLog = new AuditLog
            {
                UserId = userId,
                Action = action,
                EntityType = entityType,
                EntityId = entityId,
                OldValues = oldValues != null ? JsonSerializer.Serialize(oldValues) : null,
                NewValues = newValues != null ? JsonSerializer.Serialize(newValues) : null,
                IpAddress = httpContext?.Connection?.RemoteIpAddress?.ToString(),
                UserAgent = httpContext?.Request?.Headers["User-Agent"].FirstOrDefault(),
                AdditionalInfo = additionalInfo
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Audit logging should never crash the application
            Console.WriteLine($"[AUDIT ERROR] Failed to log '{action}': {ex.Message}");
        }
    }
}

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task SendAsync(Guid userId, string titleEn, string titleAr, string messageEn, string messageAr, string? link = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            TitleEn = titleEn,
            TitleAr = titleAr,
            MessageEn = messageEn,
            MessageAr = messageAr,
            Link = link
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task SendToRoleAsync(string role, string titleEn, string titleAr, string messageEn, string messageAr, string? link = null)
    {
        var userIds = await _context.UserRoles
            .Where(ur => ur.RoleId == _context.Roles.Where(r => r.Name == role).Select(r => r.Id).FirstOrDefault())
            .Select(ur => ur.UserId)
            .ToListAsync();

        foreach (var userId in userIds)
        {
            await SendAsync(userId, titleEn, titleAr, messageEn, messageAr, link);
        }
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }
}

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return userId != null ? Guid.Parse(userId) : null;
        }
    }

    public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
    public string? UserName => _httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
    
    public IEnumerable<string> Roles => _httpContextAccessor.HttpContext?.User?.FindAll(System.Security.Claims.ClaimTypes.Role)
        .Select(c => c.Value) ?? Enumerable.Empty<string>();
    
    public string Language => _httpContextAccessor.HttpContext?.User?.FindFirst("Language")?.Value ?? "English";
    
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}

public class EmailService : IEmailService
{
    private readonly string _smtpHost;
    private readonly int _smtpPort;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(string smtpHost, int smtpPort, string fromEmail, string fromName)
    {
        _smtpHost = smtpHost;
        _smtpPort = smtpPort;
        _fromEmail = fromEmail;
        _fromName = fromName;
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
    {
        // TODO: Implement actual email sending
        // For now, just log
        Console.WriteLine($"[EMAIL] To: {to}, Subject: {subject}");
        await Task.CompletedTask;
    }

    public async Task SendEmailAsync(IEnumerable<string> to, string subject, string body, bool isHtml = true)
    {
        foreach (var email in to)
        {
            await SendEmailAsync(email, subject, body, isHtml);
        }
    }

    public async Task SendTemplateEmailAsync(string to, string templateName, object model, string language = "en")
    {
        // TODO: Implement template-based email
        await Task.CompletedTask;
    }
}
