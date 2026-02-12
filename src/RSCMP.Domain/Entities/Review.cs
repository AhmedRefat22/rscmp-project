using RSCMP.Domain.Common;
using RSCMP.Domain.Enums;

namespace RSCMP.Domain.Entities;

public class Review : BaseEntity
{
    public Guid ResearchId { get; set; }
    public Guid ReviewerId { get; set; }
    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
    public string? CommentsToAuthor { get; set; }
    public string? CommentsToChairman { get; set; }
    public int? OverallScore { get; set; }
    public DecisionType? Recommendation { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public string? ChairmanFeedback { get; set; }
    public bool IsChairApproved { get; set; } = false;

    // Navigation properties
    public virtual Research Research { get; set; } = null!;
    public virtual ApplicationUser Reviewer { get; set; } = null!;
    public virtual ICollection<ReviewScore> Scores { get; set; } = new List<ReviewScore>();
}

public class ReviewCriteria : BaseEntity
{
    public Guid ConferenceId { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int MaxScore { get; set; } = 10;
    public int MinScore { get; set; } = 0;
    public double Weight { get; set; } = 1.0;
    public int Order { get; set; } = 1;
    public bool IsRequired { get; set; } = true;

    public virtual Conference Conference { get; set; } = null!;
    public virtual ICollection<ReviewScore> Scores { get; set; } = new List<ReviewScore>();
}

public class ReviewScore : BaseEntity
{
    public Guid ReviewId { get; set; }
    public Guid CriteriaId { get; set; }
    public int Score { get; set; }
    public string? Comment { get; set; }

    public virtual Review Review { get; set; } = null!;
    public virtual ReviewCriteria Criteria { get; set; } = null!;
}

public class ChairmanDecision : BaseEntity
{
    public Guid ResearchId { get; set; }
    public Guid ChairmanId { get; set; }
    public DecisionType Decision { get; set; }
    public string? Justification { get; set; }
    public string? CommentsToAuthor { get; set; }
    public DateTime DecidedAt { get; set; } = DateTime.UtcNow;
    public bool NotificationSent { get; set; } = false;

    public virtual Research Research { get; set; } = null!;
    public virtual ApplicationUser Chairman { get; set; } = null!;
}
