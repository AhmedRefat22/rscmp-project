using Microsoft.EntityFrameworkCore;
using RSCMP.Domain.Entities;
using RSCMP.Domain.Enums;
using RSCMP.Domain.Interfaces;
using RSCMP.Infrastructure.Data;

namespace RSCMP.Infrastructure.Repositories;

public class ConferenceRepository : Repository<Conference>, IConferenceRepository
{
    public ConferenceRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Conference>> GetActiveConferencesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(c => c.IsActive && c.EndDate >= DateTime.UtcNow)
            .OrderByDescending(c => c.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<Conference?> GetWithResearchesAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Researches.Where(r => !r.IsDeleted))
                .ThenInclude(r => r.Authors.Where(a => !a.IsDeleted))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Conference?> GetWithReviewersAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Reviewers)
                .ThenInclude(cr => cr.Reviewer)
            .Include(c => c.ReviewCriteria.Where(rc => !rc.IsDeleted))
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
}

public class ResearchRepository : Repository<Research>, IResearchRepository
{
    public ResearchRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Research?> GetWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Conference)
            .Include(r => r.Submitter)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .Include(r => r.Files.Where(f => !f.IsDeleted))
            .Include(r => r.Reviews.Where(rv => !rv.IsDeleted))
                .ThenInclude(rv => rv.Reviewer)
            .Include(r => r.Decision)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Research>> GetByConferenceAsync(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .Where(r => r.ConferenceId == conferenceId)
            .OrderByDescending(r => r.SubmittedAt ?? r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Research>> GetBySubmitterAsync(Guid submitterId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Conference)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .Where(r => r.SubmitterId == submitterId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Research>> GetByStatusAsync(ResearchStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Conference)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.SubmittedAt ?? r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Research>> GetPublicResearchesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Conference)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .Where(r => r.IsPublic && r.Status == ResearchStatus.Approved)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<string> GenerateSubmissionNumberAsync(Guid conferenceId, CancellationToken cancellationToken = default)
    {
        var count = await _dbSet.CountAsync(r => r.ConferenceId == conferenceId, cancellationToken);
        var year = DateTime.UtcNow.Year;
        return $"SUB-{year}-{count + 1:D5}";
    }
}

public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Review>> GetByReviewerAsync(Guid reviewerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Research)
                .ThenInclude(res => res.Conference)
            .Where(r => r.ReviewerId == reviewerId)
            .OrderByDescending(r => r.AssignedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Review>> GetByResearchAsync(Guid researchId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Reviewer)
            .Include(r => r.Scores)
                .ThenInclude(s => s.Criteria)
            .Where(r => r.ResearchId == researchId)
            .OrderBy(r => r.AssignedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Review?> GetWithScoresAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Research)
            .Include(r => r.Reviewer)
            .Include(r => r.Scores)
                .ThenInclude(s => s.Criteria)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Review>> GetPendingReviewsAsync(Guid reviewerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(r => r.Research)
                .ThenInclude(res => res.Conference)
            .Where(r => r.ReviewerId == reviewerId && 
                       (r.Status == ReviewStatus.Pending || r.Status == ReviewStatus.InProgress))
            .OrderBy(r => r.DueDate)
            .ToListAsync(cancellationToken);
    }
}

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Notification>> GetByUserAsync(Guid userId, bool unreadOnly = false, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Where(n => n.UserId == userId);
        
        if (unreadOnly)
            query = query.Where(n => !n.IsRead);
        
        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);
    }
}
