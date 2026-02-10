using RSCMP.Application.DTOs;

namespace RSCMP.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);
    Task LogoutAsync(Guid userId);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<bool> RequestPasswordResetAsync(ResetPasswordRequest request);
    Task<bool> ConfirmPasswordResetAsync(ResetPasswordConfirmRequest request);
    Task<UserDto> GetCurrentUserAsync(Guid userId);
    Task<UserDto> UpdateProfileAsync(Guid userId, UserProfileUpdateRequest request);
    Task<IEnumerable<string>> GetUserRolesAsync(Guid userId);
    Task<bool> ValidateRoleAsync(Guid userId, string role);
}

public interface IConferenceService
{
    Task<ConferenceDto> GetByIdAsync(Guid id);
    Task<IEnumerable<ConferenceDto>> GetAllAsync(bool activeOnly = false);
    Task<ConferenceDto> CreateAsync(ConferenceCreateRequest request);
    Task<ConferenceDto> UpdateAsync(Guid id, ConferenceUpdateRequest request);
    Task DeleteAsync(Guid id);
    Task<IEnumerable<ReviewCriteriaDto>> GetReviewCriteriaAsync(Guid conferenceId);
    Task<ReviewCriteriaDto> AddReviewCriteriaAsync(Guid conferenceId, ReviewCriteriaCreateRequest request);
    Task DeleteReviewCriteriaAsync(Guid criteriaId);
    Task AssignReviewerAsync(Guid conferenceId, Guid reviewerId);
    Task RemoveReviewerAsync(Guid conferenceId, Guid reviewerId);
    Task<ConferenceStatisticsDto> GetStatisticsAsync(Guid conferenceId);
}

public interface IResearchService
{
    Task<ResearchDto> GetByIdAsync(Guid id);
    Task<PagedResult<ResearchListDto>> GetAllAsync(PagedRequest request, Guid? conferenceId = null, string? status = null);
    Task<IEnumerable<ResearchListDto>> GetBySubmitterAsync(Guid submitterId);
    Task<ResearchDto> CreateAsync(Guid submitterId, ResearchCreateRequest request);
    Task<ResearchDto> UpdateAsync(Guid id, ResearchUpdateRequest request);
    Task DeleteAsync(Guid id);
    Task<ResearchDto> SubmitAsync(Guid researchId);
    Task<ResearchDto> WithdrawAsync(Guid researchId);
    Task<FileUploadResponse> UploadFileAsync(Guid researchId, Stream fileStream, string fileName, string contentType, string fileType);
    Task DeleteFileAsync(Guid fileId);
    Task<Stream?> DownloadFileAsync(Guid fileId);
    Task<IEnumerable<PublicResearchDto>> GetPublicResearchesAsync(Guid? conferenceId = null);
    Task IncrementViewCountAsync(Guid researchId);
}

public interface IReviewService
{
    Task<ReviewDto> GetByIdAsync(Guid id);
    Task<IEnumerable<ReviewDto>> GetByReviewerAsync(Guid reviewerId);
    Task<IEnumerable<ReviewDto>> GetByResearchAsync(Guid researchId);
    Task<ReviewDto> AssignReviewerAsync(ReviewAssignRequest request);
    Task<ReviewDto> StartReviewAsync(Guid reviewId);
    Task<ReviewDto> SubmitReviewAsync(Guid reviewId, ReviewSubmitRequest request);
    Task DeclineReviewAsync(Guid reviewId, string? reason);
    Task<IEnumerable<ReviewDto>> GetPendingReviewsAsync(Guid reviewerId);
    Task ReassignReviewAsync(Guid reviewId, Guid newReviewerId);
}

public interface IDecisionService
{
    Task<DecisionDto> GetByIdAsync(Guid id);
    Task<DecisionDto?> GetByResearchAsync(Guid researchId);
    Task<IEnumerable<DecisionDto>> GetByChairmanAsync(Guid chairmanId);
    Task<DecisionDto> CreateDecisionAsync(Guid chairmanId, DecisionCreateRequest request);
    Task<IEnumerable<ResearchListDto>> GetPendingDecisionsAsync();
    Task NotifyAuthorAsync(Guid decisionId);
}

public interface IContactService
{
    Task<ContactMessageDto> CreateAsync(ContactCreateRequest request, string? ipAddress);
    Task<PagedResult<ContactMessageDto>> GetAllAsync(PagedRequest request);
    Task<ContactMessageDto> GetByIdAsync(Guid id);
    Task<ContactMessageDto> ReplyAsync(Guid adminId, ContactReplyRequest request);
    Task MarkAsReadAsync(Guid id);
    Task ArchiveAsync(Guid id);
}

public interface IDashboardService
{
    Task<AdminDashboardDto> GetAdminDashboardAsync();
    Task<ReviewerDashboardDto> GetReviewerDashboardAsync(Guid reviewerId);
    Task<ChairmanDashboardDto> GetChairmanDashboardAsync();
}
