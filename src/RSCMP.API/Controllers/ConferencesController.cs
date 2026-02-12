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
public class ConferencesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditService _auditService;
    private readonly IFileStorageService _fileStorageService;
    private readonly ILogger<ConferencesController> _logger;

    public ConferencesController(
        ApplicationDbContext context,
        IMapper mapper,
        IAuditService auditService,
        IFileStorageService fileStorageService,
        ILogger<ConferencesController> logger)
    {
        _context = context;
        _mapper = mapper;
        _auditService = auditService;
        _fileStorageService = fileStorageService;
        _logger = logger;
    }

        [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        try
        {
            var query = _context.Conferences.AsQueryable();
            
            if (activeOnly)
                query = query.Where(c => c.IsActive && c.EndDate >= DateTime.UtcNow);

            var conferences = await query
                .Include(c => c.Researches.Where(r => !r.IsDeleted))
                .OrderByDescending(c => c.StartDate)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<ConferenceDto>>(conferences);
            return Ok(dtos);
        }
        catch (Exception ex)
        {
            // TEMPORARY DEBUGGING: Return full error details
            return StatusCode(500, new 
            { 
                error = "Database Connection Failed", 
                message = ex.Message, 
                inner = ex.InnerException?.Message,
                stackTrace = ex.StackTrace 
            });
        }
    }

    /// <summary>
    /// Get conference by ID (public)
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ConferenceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var conference = await _context.Conferences
            .Include(c => c.Researches.Where(r => !r.IsDeleted))
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conference == null)
            return NotFound(new { message = "Conference not found | المؤتمر غير موجود" });

        var dto = _mapper.Map<ConferenceDto>(conference);
        return Ok(dto);
    }

    /// <summary>
    /// Create new conference (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ConferenceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromForm] ConferenceCreateRequest request, IFormFile? logoImage, IFormFile? bannerImage)
    {
        var conference = _mapper.Map<Conference>(request);
        
        if (logoImage != null)
        {
            if (logoImage.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Logo image size exceeds 5MB limit" });

            using var stream = logoImage.OpenReadStream();
            var path = await _fileStorageService.UploadFileAsync(stream, logoImage.FileName, logoImage.ContentType, "conferences/logos");
            conference.LogoUrl = await _fileStorageService.GetFileUrlAsync(path);
        }

        if (bannerImage != null)
        {
            if (bannerImage.Length > 10 * 1024 * 1024)
                return BadRequest(new { message = "Banner image size exceeds 10MB limit" });

            using var stream = bannerImage.OpenReadStream();
            var path = await _fileStorageService.UploadFileAsync(stream, bannerImage.FileName, bannerImage.ContentType, "conferences/banners");
            conference.BannerUrl = await _fileStorageService.GetFileUrlAsync(path);
        }

        _context.Conferences.Add(conference);
        await _context.SaveChangesAsync();

        // Log without files to avoid huge log size
        await _auditService.LogAsync("Create", "Conference", conference.Id, newValues: request);
        
        var dto = _mapper.Map<ConferenceDto>(conference);
        return CreatedAtAction(nameof(GetById), new { id = conference.Id }, dto);
    }

    /// <summary>
    /// Update conference (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ConferenceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] ConferenceUpdateRequest request)
    {
        var conference = await _context.Conferences.FindAsync(id);
        if (conference == null)
            return NotFound(new { message = "Conference not found | المؤتمر غير موجود" });

        var oldValues = new { conference.NameEn, conference.NameAr, conference.IsActive };

        _mapper.Map(request, conference);
        conference.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Update", "Conference", id, oldValues, request);

        var dto = _mapper.Map<ConferenceDto>(conference);
        return Ok(dto);
    }

    /// <summary>
    /// Delete conference (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var conference = await _context.Conferences.FindAsync(id);
        if (conference == null)
            return NotFound(new { message = "Conference not found | المؤتمر غير موجود" });

        conference.IsDeleted = true;
        conference.DeletedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Delete", "Conference", id);

        return NoContent();
    }

    /// <summary>
    /// Get conference review criteria
    /// </summary>
    [HttpGet("{id}/criteria")]
    [ProducesResponseType(typeof(IEnumerable<ReviewCriteriaDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviewCriteria(Guid id)
    {
        var criteria = await _context.ReviewCriteria
            .Where(c => c.ConferenceId == id)
            .OrderBy(c => c.Order)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ReviewCriteriaDto>>(criteria);
        return Ok(dtos);
    }

    /// <summary>
    /// Add review criteria (Admin only)
    /// </summary>
    [HttpPost("{id}/criteria")]
    [Authorize(Policy = "AdminOnly")]
    [ProducesResponseType(typeof(ReviewCriteriaDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddReviewCriteria(Guid id, [FromBody] ReviewCriteriaCreateRequest request)
    {
        var conference = await _context.Conferences.FindAsync(id);
        if (conference == null)
            return NotFound(new { message = "Conference not found | المؤتمر غير موجود" });

        var criteria = _mapper.Map<ReviewCriteria>(request);
        criteria.ConferenceId = id;

        _context.ReviewCriteria.Add(criteria);
        await _context.SaveChangesAsync();

        var dto = _mapper.Map<ReviewCriteriaDto>(criteria);
        return CreatedAtAction(nameof(GetReviewCriteria), new { id }, dto);
    }

    /// <summary>
    /// Get conference statistics (Admin/Chairman)
    /// </summary>
    [HttpGet("{id}/statistics")]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(ConferenceStatisticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStatistics(Guid id)
    {
        var conference = await _context.Conferences
            .Include(c => c.Researches)
                .ThenInclude(r => r.Reviews)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conference == null)
            return NotFound(new { message = "Conference not found | المؤتمر غير موجود" });

        var researches = conference.Researches.Where(r => !r.IsDeleted).ToList();
        var reviews = researches.SelectMany(r => r.Reviews.Where(rv => !rv.IsDeleted)).ToList();

        var stats = new ConferenceStatisticsDto
        {
            ConferenceId = id,
            ConferenceName = conference.NameEn,
            TotalSubmissions = researches.Count,
            UnderReview = researches.Count(r => r.Status == ResearchStatus.UnderReview),
            Approved = researches.Count(r => r.Status == ResearchStatus.Approved),
            Rejected = researches.Count(r => r.Status == ResearchStatus.Rejected),
            AverageReviewScore = reviews.Where(r => r.OverallScore.HasValue).Select(r => r.OverallScore!.Value).DefaultIfEmpty().Average(),
            CompletedReviews = reviews.Count(r => r.Status == ReviewStatus.Completed),
            PendingReviews = reviews.Count(r => r.Status == ReviewStatus.Pending || r.Status == ReviewStatus.InProgress)
        };

        return Ok(stats);
    }
}
