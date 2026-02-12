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
[Authorize(Policy = "ChairmanOnly")]
public class DecisionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;
    private readonly ILogger<DecisionsController> _logger;

    public DecisionsController(
        ApplicationDbContext context,
        IMapper mapper,
        INotificationService notificationService,
        IAuditService auditService,
        ILogger<DecisionsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get researches pending decision
    /// </summary>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(IEnumerable<ResearchListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingDecisions()
    {
        var researches = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors)
            .Where(r => r.Status == ResearchStatus.ReviewCompleted && r.Decision == null)
            .OrderBy(r => r.SubmittedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ResearchListDto>>(researches);
        return Ok(dtos);
    }

    /// <summary>
    /// Get research details for decision
    /// </summary>
    [HttpGet("research/{researchId}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetResearchForDecision(Guid researchId)
    {
        var research = await _context.Researches
            .Include(r => r.Conference)
                .ThenInclude(c => c.ReviewCriteria)
            .Include(r => r.Submitter)
            .Include(r => r.Authors)
            .Include(r => r.Files)
            .Include(r => r.Reviews.Where(rv => !rv.IsDeleted))
                .ThenInclude(rv => rv.Reviewer)
            .Include(r => r.Reviews.Where(rv => !rv.IsDeleted))
                .ThenInclude(rv => rv.Scores)
                    .ThenInclude(s => s.Criteria)
            .Include(r => r.Decision)
            .FirstOrDefaultAsync(r => r.Id == researchId);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        var completedReviews = research.Reviews.Where(r => r.Status == ReviewStatus.Completed).ToList();

        var response = new
        {
            Research = new
            {
                research.Id,
                research.TitleEn,
                research.TitleAr,
                research.AbstractEn,
                research.AbstractAr,
                research.SubmissionNumber,
                research.Status,
                ConferenceName = research.Conference?.NameEn
            },
            Reviews = completedReviews.Select(r => new
            {
                r.Id,
                ReviewerName = r.Reviewer.FullNameEn,
                r.OverallScore,
                Recommendation = r.Recommendation.ToString(),
                r.CommentsToChairman,
                r.CommentsToAuthor,
                r.CompletedAt,
                Status = r.Status.ToString(),
                r.IsChairApproved,
                Scores = r.Scores.Select(s => new
                {
                    CriteriaId = s.CriteriaId,
                    CriteriaNameEn = s.Criteria.NameEn,
                    CriteriaNameAr = s.Criteria.NameAr,
                    s.Score,
                    MaxScore = s.Criteria.MaxScore,
                    s.Comment
                })
            }),
            Summary = new
            {
                AverageScore = completedReviews.Where(r => r.OverallScore.HasValue).Select(r => r.OverallScore!.Value).DefaultIfEmpty().Average(),
                ReviewCount = completedReviews.Count,
                ApproveRecommendations = completedReviews.Count(r => r.Recommendation == DecisionType.Approved),
                RejectRecommendations = completedReviews.Count(r => r.Recommendation == DecisionType.Rejected),
                RevisionRecommendations = completedReviews.Count(r => r.Recommendation == DecisionType.RevisionRequired)
            },
            ExistingDecision = research.Decision != null ? _mapper.Map<DecisionDto>(research.Decision) : null
        };

        return Ok(response);
    }

    /// <summary>
    /// Make decision on research (Chairman)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(DecisionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MakeDecision([FromBody] DecisionCreateRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var research = await _context.Researches
            .Include(r => r.Decision)
            .Include(r => r.Submitter)
            .FirstOrDefaultAsync(r => r.Id == request.ResearchId);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.Decision != null)
            return BadRequest(new { message = "Decision already made | تم اتخاذ القرار بالفعل" });

        if (research.Status != ResearchStatus.ReviewCompleted && 
            research.Status != ResearchStatus.Submitted &&
            research.Status != ResearchStatus.UnderReview)
            return BadRequest(new { message = "Research is not ready for decision | البحث غير جاهز للقرار" });

        var decision = new ChairmanDecision
        {
            ResearchId = request.ResearchId,
            ChairmanId = userId.Value,
            Decision = request.Decision,
            Justification = request.Justification,
            CommentsToAuthor = request.CommentsToAuthor
        };

        _context.ChairmanDecisions.Add(decision);

        // Update research status
        research.Status = request.Decision switch
        {
            DecisionType.Approved => ResearchStatus.Approved,
            DecisionType.Rejected => ResearchStatus.Rejected,
            DecisionType.RevisionRequired => ResearchStatus.RevisionRequired,
            _ => research.Status
        };

        // Make public if approved
        if (request.Decision == DecisionType.Approved)
            research.IsPublic = true;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("MakeDecision", "ChairmanDecision", decision.Id, newValues: new { request.Decision, request.ResearchId });

        // Notify author
        var (titleEn, titleAr, messageEn, messageAr) = request.Decision switch
        {
            DecisionType.Approved => (
                "Research Approved",
                "تم قبول البحث",
                $"Congratulations! Your research '{research.TitleEn}' has been approved.",
                $"تهانينا! تم قبول بحثك '{research.TitleAr}'."
            ),
            DecisionType.Rejected => (
                "Research Decision",
                "قرار البحث",
                $"Your research '{research.TitleEn}' was not accepted.",
                $"لم يتم قبول بحثك '{research.TitleAr}'."
            ),
            DecisionType.RevisionRequired => (
                "Revision Required",
                "مطلوب تعديل",
                $"Your research '{research.TitleEn}' requires revision.",
                $"بحثك '{research.TitleAr}' يتطلب تعديلات."
            ),
            _ => ("", "", "", "")
        };

        await _notificationService.SendAsync(
            research.SubmitterId,
            titleEn,
            titleAr,
            messageEn,
            messageAr,
            $"/my-submissions/{research.Id}"
        );

        // Reload with chairman info
        decision = await _context.ChairmanDecisions
            .Include(d => d.Research)
            .Include(d => d.Chairman)
            .FirstOrDefaultAsync(d => d.Id == decision.Id);

        if (decision == null)
            return StatusCode(500, new { message = "Failed to retrieve created decision | فشل في استرجاع القرار الذي تم إنشاؤه" });

        var dto = _mapper.Map<DecisionDto>(decision);
        return CreatedAtAction(nameof(GetById), new { id = decision.Id }, dto);
    }

    /// <summary>
    /// Get decision by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(DecisionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var decision = await _context.ChairmanDecisions
            .Include(d => d.Research)
            .Include(d => d.Chairman)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (decision == null)
            return NotFound(new { message = "Decision not found | القرار غير موجود" });

        var dto = _mapper.Map<DecisionDto>(decision);
        return Ok(dto);
    }

    /// <summary>
    /// Get all decisions by chairman
    /// </summary>
    [HttpGet("my-decisions")]
    [ProducesResponseType(typeof(IEnumerable<DecisionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDecisions()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var decisions = await _context.ChairmanDecisions
            .Include(d => d.Research)
            .Include(d => d.Chairman)
            .Where(d => d.ChairmanId == userId.Value)
            .OrderByDescending(d => d.DecidedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<DecisionDto>>(decisions);
        return Ok(dtos);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
