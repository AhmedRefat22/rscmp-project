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
public record ResearchDto(
    Guid Id,
    Guid ConferenceId,
    string ConferenceName,
    string TitleEn,
    string TitleAr,
    string AbstractEn,
    string AbstractAr,
    string? Keywords,
    string? TopicArea,
    ResearchStatus Status,
    string? SubmissionNumber,
    DateTime? SubmittedAt,
    DateTime CreatedAt,
    IEnumerable<AuthorDto> Authors,
    int ReviewCount,
    double? AverageScore
);
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
public record ResearchListDto(
    Guid Id,
    string TitleEn,
    string TitleAr,
    string? SubmissionNumber,
    ResearchStatus Status,
    DateTime? SubmittedAt,
    string ConferenceName,
    int AuthorCount
);
public record PublicResearchDto(
    Guid Id,
    string TitleEn,
    string TitleAr,
    string AbstractEn,
    string AbstractAr,
    string? Keywords,
    string ConferenceName,
    IEnumerable<PublicAuthorDto> Authors,
    DateTime? SubmittedAt,
    int ViewCount,
    int DownloadCount
);

// ============ Author DTOs ============
public record AuthorDto(
    Guid Id,
    string FullName,
    string Email,
    string? Institution,
    string? Country,
    int Order,
    bool IsCorresponding
);
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
public record PublicAuthorDto(string FullName, string? Institution, bool IsCorresponding);

// ============ Review DTOs ============
public record ReviewDto(
    Guid Id,
    Guid ResearchId,
    string ResearchTitle,
    ReviewStatus Status,
    int? OverallScore,
    DecisionType? Recommendation,
    DateTime? DueDate,
    DateTime? CompletedAt,
    IEnumerable<ReviewScoreDto>? Scores
);
public record ReviewAssignRequest(Guid ResearchId, Guid ReviewerId, DateTime? DueDate);
public record ReviewSubmitRequest(
    string? CommentsToAuthor,
    string? CommentsToChairman,
    DecisionType Recommendation,
    IEnumerable<ReviewScoreRequest> Scores
);
public record ReviewScoreDto(Guid CriteriaId, string CriteriaName, int Score, int MaxScore, string? Comment);
public record ReviewScoreRequest(Guid CriteriaId, int Score, string? Comment);
public record ReviewCriteriaDto(
    Guid Id,
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    int MaxScore,
    int MinScore,
    double Weight,
    int Order
);
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
public record DecisionDto(
    Guid Id,
    Guid ResearchId,
    string ResearchTitle,
    DecisionType Decision,
    string? Justification,
    DateTime DecidedAt,
    string ChairmanName
);
public record DecisionCreateRequest(
    Guid ResearchId,
    DecisionType Decision,
    string? Justification,
    string? CommentsToAuthor
);

// ============ Notification DTOs ============
public record NotificationDto(
    Guid Id,
    string TitleEn,
    string TitleAr,
    string MessageEn,
    string MessageAr,
    NotificationType Type,
    string? Link,
    bool IsRead,
    DateTime CreatedAt
);

// ============ Contact DTOs ============
public record ContactMessageDto(
    Guid Id,
    string Name,
    string Email,
    string Subject,
    string Message,
    ContactMessageStatus Status,
    DateTime CreatedAt,
    string? Response,
    DateTime? RespondedAt
);
public record ContactCreateRequest(string Name, string Email, string Subject, string Message);
public record ContactReplyRequest(Guid MessageId, string Response);

// ============ Dashboard DTOs ============
public record AdminDashboardDto(
    int TotalConferences,
    int ActiveConferences,
    int TotalResearches,
    int PendingResearches,
    int TotalUsers,
    int TotalReviewers,
    int UnreadMessages,
    IEnumerable<RecentActivityDto> RecentActivities
);
public record ReviewerDashboardDto(
    int PendingReviews,
    int CompletedReviews,
    int TotalAssigned,
    IEnumerable<ReviewDto> UpcomingReviews
);
public record ChairmanDashboardDto(
    int PendingDecisions,
    int ApprovedResearches,
    int RejectedResearches,
    int TotalResearches,
    IEnumerable<ResearchListDto> PendingResearches
);
public record RecentActivityDto(string Action, string Entity, DateTime Timestamp, string? Details);

// ============ Statistics DTOs ============
public record ConferenceStatisticsDto(
    Guid ConferenceId,
    string ConferenceName,
    int TotalSubmissions,
    int UnderReview,
    int Approved,
    int Rejected,
    double AverageReviewScore,
    int CompletedReviews,
    int PendingReviews
);

// ============ File DTOs ============
public record FileUploadResponse(Guid FileId, string FileName, long FileSize, string FileType);

// ============ Pagination ============
public record PagedResult<T>(
    IEnumerable<T> Items,
    int TotalCount,
    int PageNumber,
    int PageSize,
    int TotalPages
);
public record PagedRequest(int PageNumber = 1, int PageSize = 10, string? SortBy = null, bool SortDescending = false, string? Search = null);
