namespace RSCMP.Domain.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, string folder = "uploads");
    Task<Stream?> DownloadFileAsync(string filePath);
    Task<bool> DeleteFileAsync(string filePath);
    Task<bool> FileExistsAsync(string filePath);
    Task<string> GetFileUrlAsync(string filePath);
    string GetFileChecksum(Stream fileStream);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    Task SendEmailAsync(IEnumerable<string> to, string subject, string body, bool isHtml = true);
    Task SendTemplateEmailAsync(string to, string templateName, object model, string language = "en");
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    string? UserName { get; }
    IEnumerable<string> Roles { get; }
    string Language { get; }
    bool IsAuthenticated { get; }
}

public interface IAuditService
{
    Task LogAsync(string action, string entityType, Guid? entityId = null, object? oldValues = null, object? newValues = null, string? additionalInfo = null);
}

public interface ILocalizationService
{
    string GetString(string key, string? language = null);
    string GetString(string key, object[] args, string? language = null);
    Dictionary<string, string> GetAllStrings(string? language = null);
}

public interface INotificationService
{
    Task SendAsync(Guid userId, string titleEn, string titleAr, string messageEn, string messageAr, string? link = null);
    Task SendToRoleAsync(string role, string titleEn, string titleAr, string messageEn, string messageAr, string? link = null);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
}
