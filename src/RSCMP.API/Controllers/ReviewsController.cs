using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using RSCMP.Application.DTOs;
using RSCMP.Domain.Entities;
using RSCMP.Domain.Enums;
using RSCMP.Domain.Interfaces;
using RSCMP.Infrastructure.Data;

namespace RSCMP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(
        ApplicationDbContext context,
        IMapper mapper,
        INotificationService notificationService,
        IAuditService auditService,
        ILogger<ReviewsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get submitted research available for review (Reviewer)
    /// </summary>
    [HttpGet("available")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(IEnumerable<ResearchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableResearch()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        // Get research IDs already assigned to this reviewer
        var assignedResearchIds = await _context.Reviews
            .Where(r => r.ReviewerId == userId.Value && !r.IsDeleted)
            .Select(r => r.ResearchId)
            .ToListAsync();

        // Get submitted research not yet assigned to this reviewer
        var availableResearch = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors)
            .Where(r => (r.Status == ResearchStatus.Submitted || r.Status == ResearchStatus.UnderReview)
                        && !assignedResearchIds.Contains(r.Id)
                        && r.SubmitterId != userId.Value)
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ResearchDto>>(availableResearch);
        return Ok(dtos);
    }

    /// <summary>
    /// Self-assign a research for review (Reviewer)
    /// </summary>
    [HttpPost("self-assign/{researchId}")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SelfAssign(Guid researchId)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var research = await _context.Researches
            .Include(r => r.Conference)
            .FirstOrDefaultAsync(r => r.Id == researchId);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.SubmitterId == userId.Value)
            return BadRequest(new { message = "You cannot review your own research | لا يمكنك مراجعة بحثك الخاص" });

        // Check if already assigned
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ResearchId == researchId && r.ReviewerId == userId.Value && !r.IsDeleted);
        if (existingReview != null)
            return BadRequest(new { message = "You are already assigned to this research | أنت معين بالفعل لهذا البحث" });

        var review = new Review
        {
            ResearchId = researchId,
            ReviewerId = userId.Value,
            Status = ReviewStatus.Pending,
            AssignedAt = DateTime.UtcNow,
            DueDate = research.Conference.ReviewDeadline
        };

        _context.Reviews.Add(review);

        // Update research status to UnderReview if it was just Submitted
        if (research.Status == ResearchStatus.Submitted)
        {
            research.Status = ResearchStatus.UnderReview;
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("SelfAssignReview", "Review", review.Id, newValues: new { researchId });

        // Reload with includes
        review = await _context.Reviews
            .Include(r => r.Research)
            .Include(r => r.Scores)
            .FirstOrDefaultAsync(r => r.Id == review.Id);

        var dto = _mapper.Map<ReviewDto>(review);
        return Ok(dto);
    }

    /// <summary>
    /// Get my pending reviews (Reviewer)
    /// </summary>
    [HttpGet("pending")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingReviews()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var reviews = await _context.Reviews
            .Include(r => r.Research)
                .ThenInclude(res => res.Conference)
            .Where(r => r.ReviewerId == userId.Value && 
                       (r.Status == ReviewStatus.Pending || r.Status == ReviewStatus.InProgress))
            .OrderBy(r => r.DueDate)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
        return Ok(dtos);
    }

    /// <summary>
    /// Get my completed reviews (Reviewer)
    /// </summary>
    [HttpGet("completed")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompletedReviews()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var reviews = await _context.Reviews
            .Include(r => r.Research)
                .ThenInclude(res => res.Conference)
            .Where(r => r.ReviewerId == userId.Value && r.Status == ReviewStatus.Completed)
            .OrderByDescending(r => r.CompletedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
        return Ok(dtos);
    }

    /// <summary>
    /// Get review by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var review = await _context.Reviews
            .Include(r => r.Research)
            .Include(r => r.Reviewer)
            .Include(r => r.Scores)
                .ThenInclude(s => s.Criteria)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            return NotFound(new { message = "Review not found | المراجعة غير موجودة" });

        // Check authorization
        var userId = GetCurrentUserId();
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value);
        
        if (review.ReviewerId != userId && !userRoles.Contains("Admin") && !userRoles.Contains("Chairman"))
            return Forbid();

        var dto = _mapper.Map<ReviewDto>(review);
        return Ok(dto);
    }

    /// <summary>
    /// Assign reviewer to research (Admin/Chairman)
    /// </summary>
    [HttpPost("assign")]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AssignReviewer([FromBody] ReviewAssignRequest request)
    {
        var research = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Reviews)
            .FirstOrDefaultAsync(r => r.Id == request.ResearchId);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.Status != ResearchStatus.Submitted && research.Status != ResearchStatus.UnderReview)
            return BadRequest(new { message = "Research is not in reviewable state | البحث ليس في حالة قابلة للمراجعة" });

        // Check if reviewer already assigned
        if (research.Reviews.Any(r => r.ReviewerId == request.ReviewerId && !r.IsDeleted))
            return BadRequest(new { message = "Reviewer already assigned | المراجع مُعين بالفعل" });

        // Check max reviewers
        var activeReviews = research.Reviews.Count(r => !r.IsDeleted);
        if (activeReviews >= research.Conference.MaxReviewersPerPaper)
            return BadRequest(new { message = "Maximum reviewers reached | تم الوصول للحد الأقصى من المراجعين" });

        var review = new Review
        {
            ResearchId = request.ResearchId,
            ReviewerId = request.ReviewerId,
            Status = ReviewStatus.Pending,
            AssignedAt = DateTime.UtcNow,
            DueDate = request.DueDate ?? DateTime.UtcNow.AddDays(14)
        };

        _context.Reviews.Add(review);

        // Update research status
        if (research.Status == ResearchStatus.Submitted)
            research.Status = ResearchStatus.UnderReview;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("AssignReviewer", "Review", review.Id, newValues: new { request.ResearchId, request.ReviewerId });

        // Notify reviewer
        await _notificationService.SendAsync(
            request.ReviewerId,
            "New Review Assignment",
            "تعيين مراجعة جديدة",
            $"You have been assigned to review a research paper. Due date: {review.DueDate:d}",
            $"تم تعيينك لمراجعة بحث. تاريخ الاستحقاق: {review.DueDate:d}",
            $"/reviewer/reviews/{review.Id}"
        );

        var dto = _mapper.Map<ReviewDto>(review);
        return CreatedAtAction(nameof(GetById), new { id = review.Id }, dto);
    }

    /// <summary>
    /// Start review (Reviewer)
    /// </summary>
    [HttpPost("{id}/start")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> StartReview(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Review not found | المراجعة غير موجودة" });

        if (review.ReviewerId != userId)
            return Forbid();

        if (review.Status != ReviewStatus.Pending)
            return BadRequest(new { message = "Review already started or completed | المراجعة بدأت أو اكتملت بالفعل" });

        review.Status = ReviewStatus.InProgress;
        review.StartedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("StartReview", "Review", id);

        var dto = _mapper.Map<ReviewDto>(review);
        return Ok(dto);
    }

    /// <summary>
    /// Submit review (Reviewer)
    /// </summary>
    [HttpPost("{id}/submit")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitReview(Guid id, [FromBody] ReviewSubmitRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var review = await _context.Reviews
            .Include(r => r.Research)
                .ThenInclude(res => res.Conference)
                    .ThenInclude(c => c.ReviewCriteria)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (review == null)
            return NotFound(new { message = "Review not found | المراجعة غير موجودة" });

        if (review.ReviewerId != userId)
            return Forbid();

        if (review.Status == ReviewStatus.Completed)
            return BadRequest(new { message = "Review already completed | المراجعة مكتملة بالفعل" });

        // Validate all criteria are scored
        var requiredCriteria = review.Research.Conference.ReviewCriteria.Where(c => c.IsRequired && !c.IsDeleted).ToList();
        foreach (var criteria in requiredCriteria)
        {
            if (!request.Scores.Any(s => s.CriteriaId == criteria.Id))
                return BadRequest(new { message = $"Missing score for: {criteria.NameEn} | الدرجة مطلوبة لـ: {criteria.NameAr}" });
        }

        // Save scores (Clear existing if re-submitting)
        var existingScores = await _context.ReviewScores.Where(rs => rs.ReviewId == id).ToListAsync();
        _context.ReviewScores.RemoveRange(existingScores);

        foreach (var scoreRequest in request.Scores)
        {
            var criteria = review.Research.Conference.ReviewCriteria.FirstOrDefault(c => c.Id == scoreRequest.CriteriaId);
            if (criteria == null)
                continue;

            if (scoreRequest.Score < criteria.MinScore || scoreRequest.Score > criteria.MaxScore)
                return BadRequest(new { message = $"Score out of range for {criteria.NameEn} | الدرجة خارج النطاق لـ {criteria.NameAr}" });

            var score = new ReviewScore
            {
                ReviewId = id,
                CriteriaId = scoreRequest.CriteriaId,
                Score = scoreRequest.Score,
                Comment = scoreRequest.Comment
            };
            _context.ReviewScores.Add(score);
        }

        // Calculate overall score
        var totalWeight = requiredCriteria.Sum(c => c.Weight);
        var weightedScore = request.Scores
            .Where(s => requiredCriteria.Any(c => c.Id == s.CriteriaId))
            .Sum(s =>
            {
                var criteria = requiredCriteria.First(c => c.Id == s.CriteriaId);
                return (s.Score / (double)criteria.MaxScore) * criteria.Weight;
            });

        review.OverallScore = (int)Math.Round((weightedScore / totalWeight) * 100);
        review.CommentsToAuthor = request.CommentsToAuthor;
        review.CommentsToChairman = request.CommentsToChairman;
        review.Recommendation = request.Recommendation;
        review.Status = ReviewStatus.Completed;
        review.CompletedAt = DateTime.UtcNow;
        review.IsChairApproved = false; // Reset approval on new submission

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("SubmitReview", "Review", id, newValues: new { review.OverallScore, review.Recommendation });

        // Check if all reviews completed
        var research = review.Research;
        var allReviews = await _context.Reviews
            .Where(r => r.ResearchId == research.Id && !r.IsDeleted)
            .ToListAsync();

        var completedReviews = allReviews.Count(r => r.Status == ReviewStatus.Completed);
        if (completedReviews >= research.Conference.MinReviewersPerPaper)
        {
            // Only update research status if it's not already in a final state
            if (research.Status == ResearchStatus.UnderReview || research.Status == ResearchStatus.Submitted)
            {
                research.Status = ResearchStatus.ReviewCompleted;
                await _context.SaveChangesAsync();
            }

            // Notify chairman
            await _notificationService.SendToRoleAsync(
                "Chairman",
                "Review Submitted",
                "تم تقديم مراجعة",
                $"A review for '{research.TitleEn}' has been submitted/updated",
                $"تم تقديم/تحديث مراجعة للبحث '{research.TitleAr}'",
                $"/chairman/research/{research.Id}"
            );
        }

        // Reload and return
        review = await _context.Reviews
            .Include(r => r.Research)
            .Include(r => r.Scores)
                .ThenInclude(s => s.Criteria)
            .FirstOrDefaultAsync(r => r.Id == id);

        var dto = _mapper.Map<ReviewDto>(review);
        return Ok(dto);
    }

    /// <summary>
    /// Return review to reviewer for modification (Chairman)
    /// </summary>
    [HttpPost("{id}/return")]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReturnReview(Guid id, [FromBody] string feedback)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Review not found | المراجعة غير موجودة" });

        if (string.IsNullOrWhiteSpace(feedback))
            return BadRequest(new { message = "Feedback is required | الملاحظات مطلوبة" });

        review.Status = ReviewStatus.Returned;
        review.ChairmanFeedback = feedback;
        review.IsChairApproved = false;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("ReturnReview", "Review", id, additionalInfo: feedback);

        // Notify reviewer
        await _notificationService.SendAsync(
            review.ReviewerId,
            "Review Returned",
            "إعادة المراجعة",
            "The chairman has returned your review for modification.",
            "قام رئيس اللجنة بإعادة مراجعتك للتعديل.",
            $"/reviewer/reviews/{review.Id}"
        );

        var dto = _mapper.Map<ReviewDto>(review);
        return Ok(dto);
    }

    /// <summary>
    /// Approve review to be visible to researcher (Chairman)
    /// </summary>
    [HttpPost("{id}/approve")]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ApproveReview(Guid id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Review not found | المراجعة غير موجودة" });

        review.IsChairApproved = true;
        
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("ApproveReview", "Review", id);

        var dto = _mapper.Map<ReviewDto>(review);
        return Ok(dto);
    }

    /// <summary>
    /// Decline review assignment (Reviewer)
    /// </summary>
    [HttpPost("{id}/decline")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeclineReview(Guid id, [FromBody] string? reason)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Review not found | المراجعة غير موجودة" });

        if (review.ReviewerId != userId)
            return Forbid();

        if (review.Status != ReviewStatus.Pending)
            return BadRequest(new { message = "Can only decline pending reviews | يمكن رفض المراجعات المعلقة فقط" });

        review.Status = ReviewStatus.Declined;
        review.CommentsToChairman = reason;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("DeclineReview", "Review", id, additionalInfo: reason);

        // Notify chairman
        await _notificationService.SendToRoleAsync(
            "Chairman",
            "Review Declined",
            "تم رفض المراجعة",
            $"A reviewer has declined the review assignment",
            $"رفض مراجع تعيين المراجعة",
            $"/chairman/research/{review.ResearchId}"
        );

        return NoContent();
    }

    /// <summary>
    /// Get reviews for a research (Admin/Chairman)
    /// </summary>
    [HttpGet("research/{researchId}")]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetByResearch(Guid researchId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.Scores)
                .ThenInclude(s => s.Criteria)
            .Where(r => r.ResearchId == researchId)
            .OrderBy(r => r.AssignedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
        return Ok(dtos);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
