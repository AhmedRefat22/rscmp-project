using RSCMP.Domain.Common;
using RSCMP.Domain.Enums;

namespace RSCMP.Domain.Entities;

public class Conference : LocalizedEntity
{
    public string? LogoUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? Website { get; set; }
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime SubmissionDeadline { get; set; }
    public DateTime? ReviewDeadline { get; set; }
    public int MaxReviewersPerPaper { get; set; } = 3;
    public int MinReviewersPerPaper { get; set; } = 2;
    public bool IsActive { get; set; } = true;
    public bool AcceptingSubmissions { get; set; } = true;
    public string? ContactEmail { get; set; }

    // Navigation properties
    public virtual ICollection<Research> Researches { get; set; } = new List<Research>();
    public virtual ICollection<ReviewCriteria> ReviewCriteria { get; set; } = new List<ReviewCriteria>();
    public virtual ICollection<ConferenceReviewer> Reviewers { get; set; } = new List<ConferenceReviewer>();
}

public class ConferenceReviewer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConferenceId { get; set; }
    public Guid ReviewerId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public virtual Conference Conference { get; set; } = null!;
    public virtual ApplicationUser Reviewer { get; set; } = null!;
}
