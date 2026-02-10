using Microsoft.AspNetCore.Identity;
using RSCMP.Domain.Enums;

namespace RSCMP.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullNameEn { get; set; } = string.Empty;
    public string FullNameAr { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Department { get; set; }
    public string? AcademicTitle { get; set; }
    public string? Bio { get; set; }
    public Language PreferredLanguage { get; set; } = Language.English;
    public string? ProfileImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Navigation properties
    public virtual ICollection<Research> SubmittedResearches { get; set; } = new List<Research>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ICollection<ChairmanDecision> Decisions { get; set; } = new List<ChairmanDecision>();
    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}

public class ApplicationRole : IdentityRole<Guid>
{
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
