using RSCMP.Domain.Entities;
using RSCMP.Domain.Enums;

namespace RSCMP.Domain.Interfaces;

public interface IConferenceRepository : IRepository<Conference>
{
    Task<IEnumerable<Conference>> GetActiveConferencesAsync(CancellationToken cancellationToken = default);
    Task<Conference?> GetWithResearchesAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Conference?> GetWithReviewersAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IResearchRepository : IRepository<Research>
{
    Task<Research?> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Research>> GetByConferenceAsync(Guid conferenceId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Research>> GetBySubmitterAsync(Guid submitterId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Research>> GetByStatusAsync(ResearchStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<Research>> GetPublicResearchesAsync(CancellationToken cancellationToken = default);
    Task<string> GenerateSubmissionNumberAsync(Guid conferenceId, CancellationToken cancellationToken = default);
}

public interface IReviewRepository : IRepository<Review>
{
    Task<IEnumerable<Review>> GetByReviewerAsync(Guid reviewerId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Review>> GetByResearchAsync(Guid researchId, CancellationToken cancellationToken = default);
    Task<Review?> GetWithScoresAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Review>> GetPendingReviewsAsync(Guid reviewerId, CancellationToken cancellationToken = default);
}

public interface INotificationRepository : IRepository<Notification>
{
    Task<IEnumerable<Notification>> GetByUserAsync(Guid userId, bool unreadOnly = false, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
}
