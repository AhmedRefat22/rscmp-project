using RSCMP.Domain.Enums;

namespace RSCMP.Application.DTOs;

// ============ Authentication DTOs ============
public record LoginRequest(string Email, string Password, bool RememberMe = false);
public record RegisterRequest(
    string Email,
    string Password,
    string ConfirmPassword,
    string FullNameEn,
    string FullNameAr,
    string PhoneNumber,
    string? Institution,
    Language PreferredLanguage = Language.English
);

// Admin-only: Create Reviewer or Chairman accounts
public record CreateUserByAdminRequest(
    string Email,
    string Password,
    string FullNameEn,
    string FullNameAr,
    string PhoneNumber,
    string? Institution,
    string Role, // "Reviewer" or "Chairman"
    Language PreferredLanguage = Language.English
);
public record RefreshTokenRequest(string AccessToken, string RefreshToken);
public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User
);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmNewPassword);
public record ResetPasswordRequest(string Email);
public record ResetPasswordConfirmRequest(string Email, string Token, string NewPassword, string ConfirmNewPassword);

// ============ User DTOs ============
public class UserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string FullNameEn { get; set; } = string.Empty;
    public string FullNameAr { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Department { get; set; }
    public string? AcademicTitle { get; set; }
    public Language PreferredLanguage { get; set; }
    public string? ProfileImageUrl { get; set; }
    public IEnumerable<string> Roles { get; set; } = new List<string>();
}
public record UserProfileUpdateRequest(
    string FullNameEn,
    string FullNameAr,
    string? Institution,
    string? Department,
    string? AcademicTitle,
    string? Bio,
    Language PreferredLanguage
);
public record RoleSelectionRequest(string Role);

// ============ Conference DTOs ============
public class ConferenceDto
{
    public ConferenceDto() { }

    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string DescriptionEn { get; set; } = string.Empty;
    public string DescriptionAr { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? Location { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime SubmissionDeadline { get; set; }
    public bool IsActive { get; set; }
    public bool AcceptingSubmissions { get; set; }
    public int ResearchCount { get; set; }
    public List<ReviewCriteriaDto> ReviewCriteria { get; set; } = new();
}
public record ConferenceCreateRequest(
    string NameEn,
    string NameAr,
    string DescriptionEn,
    string DescriptionAr,
    string? Website,
    string? Location,
    DateTime StartDate,
    DateTime EndDate,
    DateTime SubmissionDeadline,
    DateTime? ReviewDeadline,
    int MaxReviewersPerPaper = 3,
    int MinReviewersPerPaper = 2,
    string? ContactEmail = null
);
public record ConferenceUpdateRequest(
    string NameEn,
    string NameAr,
    string DescriptionEn,
    string DescriptionAr,
    string? Website,
    string? Location,
    DateTime StartDate,
    DateTime EndDate,
    DateTime SubmissionDeadline,
    DateTime? ReviewDeadline,
    bool IsActive,
    bool AcceptingSubmissions
);

// ============ Research DTOs ============
public record ResearchDto
{
    public Guid Id { get; init; }
    public Guid ConferenceId { get; init; }
    public string ConferenceName { get; init; } = string.Empty;
    public string TitleEn { get; init; } = string.Empty;
    public string TitleAr { get; init; } = string.Empty;
    public string AbstractEn { get; init; } = string.Empty;
    public string AbstractAr { get; init; } = string.Empty;
    public string? Keywords { get; init; }
    public string? TopicArea { get; init; }
    public ResearchStatus Status { get; init; }
    public string? SubmissionNumber { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public IEnumerable<AuthorDto> Authors { get; init; } = new List<AuthorDto>();
    public int ReviewCount { get; init; }
    public double? AverageScore { get; init; }
    public IEnumerable<ReviewDto>? Reviews { get; init; }
    public IEnumerable<ResearchFileDto> Files { get; init; } = new List<ResearchFileDto>();
    public ConferenceDto? Conference { get; init; }
    public DecisionDto? Decision { get; init; }
    public string SubmitterName { get; init; } = string.Empty;
}

public record ResearchFileDto
{
    public Guid Id { get; init; }
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string FileType { get; init; } = string.Empty;
}
public record ResearchCreateRequest(
    Guid ConferenceId,
    string TitleEn,
    string TitleAr,
    string AbstractEn,
    string AbstractAr,
    string? Keywords,
    string? TopicArea,
    IEnumerable<AuthorCreateRequest> Authors
);
public record ResearchUpdateRequest(
    string TitleEn,
    string TitleAr,
    string AbstractEn,
    string AbstractAr,
    string? Keywords,
    string? TopicArea,
    IEnumerable<AuthorCreateRequest> Authors
);
public record ResearchSubmitRequest(Guid ResearchId);
public record ResearchListDto
{
    public Guid Id { get; init; }
    public string TitleEn { get; init; } = string.Empty;
    public string TitleAr { get; init; } = string.Empty;
    public string? SubmissionNumber { get; init; }
    public ResearchStatus Status { get; init; }
    public DateTime? SubmittedAt { get; init; }
    public string ConferenceName { get; init; } = string.Empty;
    public int AuthorCount { get; init; }
    public double? AverageScore { get; init; }
}
public class PublicResearchDto
{
    public Guid Id { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string AbstractEn { get; set; } = string.Empty;
    public string AbstractAr { get; set; } = string.Empty;
    public string? Keywords { get; set; }
    public string ConferenceName { get; set; } = string.Empty;
    public IEnumerable<PublicAuthorDto> Authors { get; set; } = new List<PublicAuthorDto>();
    public DateTime? SubmittedAt { get; set; }
    public int ViewCount { get; set; }
    public int DownloadCount { get; set; }
}

// ============ Author DTOs ============
public class AuthorDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public string? Country { get; set; }
    public int Order { get; set; }
    public bool IsCorresponding { get; set; }
}
public record AuthorCreateRequest(
    string FullName,
    string Email,
    string? Institution,
    string? Department,
    string? Country,
    string? OrcidId,
    int Order,
    bool IsCorresponding
);
public class PublicAuthorDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Institution { get; set; }
    public bool IsCorresponding { get; set; }
}

// ============ Review DTOs ============
public record ReviewDto
{
    public Guid Id { get; init; }
    public Guid ResearchId { get; init; }
    public string ResearchTitle { get; init; } = string.Empty;
    public ReviewStatus Status { get; init; }
    public int? OverallScore { get; init; }
    public DecisionType? Recommendation { get; init; }
    public DateTime? DueDate { get; init; }
    public DateTime? CompletedAt { get; init; }
    public string? ChairmanFeedback { get; init; }
    public bool IsChairApproved { get; init; }
    public IEnumerable<ReviewScoreDto>? Scores { get; init; }
}
public record ReviewAssignRequest(Guid ResearchId, Guid ReviewerId, DateTime? DueDate);
public record ReviewSubmitRequest(
    string? CommentsToAuthor,
    string? CommentsToChairman,
    DecisionType Recommendation,
    IEnumerable<ReviewScoreRequest> Scores
);
public class ReviewScoreDto
{
    public Guid CriteriaId { get; set; }
    public string CriteriaName { get; set; } = string.Empty;
    public int Score { get; set; }
    public int MaxScore { get; set; }
    public string? Comment { get; set; }
}
public record ReviewScoreRequest(Guid CriteriaId, int Score, string? Comment);
public class ReviewCriteriaDto
{
    public Guid Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionAr { get; set; }
    public int MaxScore { get; set; }
    public int MinScore { get; set; }
    public double Weight { get; set; }
    public int Order { get; set; }
}
public record ReviewCriteriaCreateRequest(
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    int MaxScore = 10,
    int MinScore = 0,
    double Weight = 1.0,
    int Order = 1
);

// ============ Decision DTOs ============
public class DecisionDto
{
    public Guid Id { get; set; }
    public Guid ResearchId { get; set; }
    public string ResearchTitle { get; set; } = string.Empty;
    public DecisionType Decision { get; set; }
    public string? Justification { get; set; }
    public string? CommentsToAuthor { get; set; }
    public DateTime DecidedAt { get; set; }
    public string ChairmanName { get; set; } = string.Empty;
}
public record DecisionCreateRequest(
    Guid ResearchId,
    DecisionType Decision,
    string? Justification,
    string? CommentsToAuthor
);

// ============ Notification DTOs ============
public class NotificationDto
{
    public Guid Id { get; set; }
    public string TitleEn { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string? Link { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

// ============ Contact DTOs ============
public class ContactMessageDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public ContactMessageStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
}
public record ContactCreateRequest(string Name, string Email, string Subject, string Message);
public record ContactReplyRequest(Guid MessageId, string Response);

// ============ Dashboard DTOs ============
public class AdminDashboardDto
{
    public int TotalConferences { get; set; }
    public int ActiveConferences { get; set; }
    public int TotalResearches { get; set; }
    public int PendingResearches { get; set; }
    public int TotalUsers { get; set; }
    public int TotalReviewers { get; set; }
    public int UnreadMessages { get; set; }
    public IEnumerable<RecentActivityDto> RecentActivities { get; set; } = new List<RecentActivityDto>();
}
public class ReviewerDashboardDto
{
    public int PendingReviews { get; set; }
    public int CompletedReviews { get; set; }
    public int TotalAssigned { get; set; }
    public IEnumerable<ReviewDto> UpcomingReviews { get; set; } = new List<ReviewDto>();
}
public class ChairmanDashboardDto
{
    public int PendingDecisions { get; set; }
    public int ApprovedResearches { get; set; }
    public int RejectedResearches { get; set; }
    public int TotalResearches { get; set; }
    public IEnumerable<ResearchListDto> PendingResearches { get; set; } = new List<ResearchListDto>();
}
public class RecentActivityDto
{
    public string Action { get; set; } = string.Empty;
    public string Entity { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? Details { get; set; }
}

// ============ Statistics DTOs ============
public class ConferenceStatisticsDto
{
    public Guid ConferenceId { get; set; }
    public string ConferenceName { get; set; } = string.Empty;
    public int TotalSubmissions { get; set; }
    public int UnderReview { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public double AverageReviewScore { get; set; }
    public int CompletedReviews { get; set; }
    public int PendingReviews { get; set; }
}

// ============ File DTOs ============
public class FileUploadResponse
{
    public Guid FileId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string FileType { get; set; } = string.Empty;
}

// ============ Pagination ============
public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
public record PagedRequest(int PageNumber = 1, int PageSize = 10, string? SortBy = null, bool SortDescending = false, string? Search = null);

