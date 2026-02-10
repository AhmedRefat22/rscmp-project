using RSCMP.Domain.Common;
using RSCMP.Domain.Enums;

namespace RSCMP.Domain.Entities;

public class Research : BaseEntity
{
    public Guid ConferenceId { get; set; }
    public Guid SubmitterId { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string AbstractEn { get; set; } = string.Empty;
    public string AbstractAr { get; set; } = string.Empty;
    public string? Keywords { get; set; }
    public string? TopicArea { get; set; }
    public ResearchStatus Status { get; set; } = ResearchStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public string? SubmissionNumber { get; set; }
    public bool IsPublic { get; set; } = false;
    public int ViewCount { get; set; } = 0;
    public int DownloadCount { get; set; } = 0;

    // Navigation properties
    public virtual Conference Conference { get; set; } = null!;
    public virtual ApplicationUser Submitter { get; set; } = null!;
    public virtual ICollection<Author> Authors { get; set; } = new List<Author>();
    public virtual ICollection<ResearchFile> Files { get; set; } = new List<ResearchFile>();
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
    public virtual ChairmanDecision? Decision { get; set; }
}

public class Author : BaseEntity
{
    public Guid ResearchId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Department { get; set; }
    public string? Country { get; set; }
    public string? OrcidId { get; set; }
    public int Order { get; set; } = 1;
    public bool IsCorresponding { get; set; } = false;
    public Guid? UserId { get; set; }

    public virtual Research Research { get; set; } = null!;
    public virtual ApplicationUser? User { get; set; }
}

public class ResearchFile : BaseEntity
{
    public Guid ResearchId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public long FileSize { get; set; }
    public string FileType { get; set; } = "MainDocument"; // MainDocument, Supplementary, CoverLetter
    public int Version { get; set; } = 1;
    public string? Checksum { get; set; }

    public virtual Research Research { get; set; } = null!;
}
