using RSCMP.Domain.Common;
using RSCMP.Domain.Enums;

namespace RSCMP.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;
    public string? Link { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }

    public virtual ApplicationUser User { get; set; } = null!;
}

public class ContactMessage : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public ContactMessageStatus Status { get; set; } = ContactMessageStatus.New;
    public string? Response { get; set; }
    public Guid? RespondedById { get; set; }
    public DateTime? RespondedAt { get; set; }
    public string? IpAddress { get; set; }

    public virtual ApplicationUser? RespondedBy { get; set; }
}

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? AdditionalInfo { get; set; }

    public virtual ApplicationUser? User { get; set; }
}

public class SystemSetting : BaseEntity
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public string Category { get; set; } = "General";
    public bool IsPublic { get; set; } = false;
}
