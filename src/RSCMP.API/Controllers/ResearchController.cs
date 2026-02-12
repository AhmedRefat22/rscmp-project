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
public class ResearchController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IFileStorageService _fileStorageService;
    private readonly INotificationService _notificationService;
    private readonly IAuditService _auditService;
    private readonly ILogger<ResearchController> _logger;

    public ResearchController(
        ApplicationDbContext context,
        IMapper mapper,
        IFileStorageService fileStorageService,
        INotificationService notificationService,
        IAuditService auditService,
        ILogger<ResearchController> logger)
    {
        _context = context;
        _mapper = mapper;
        _fileStorageService = fileStorageService;
        _notificationService = notificationService;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get all research submissions (Admin/Chairman)
    /// </summary>
    [HttpGet]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(PagedResult<ResearchListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] PagedRequest request, [FromQuery] Guid? conferenceId = null, [FromQuery] string? status = null)
    {
        var query = _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors)
            .AsQueryable();

        if (conferenceId.HasValue)
            query = query.Where(r => r.ConferenceId == conferenceId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ResearchStatus>(status, out var researchStatus))
            query = query.Where(r => r.Status == researchStatus);

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(r =>
                r.TitleEn.Contains(request.Search) ||
                r.TitleAr.Contains(request.Search) ||
                r.SubmissionNumber!.Contains(request.Search));
        }

        var totalCount = await query.CountAsync();

        if (!string.IsNullOrEmpty(request.SortBy))
        {
            query = request.SortBy.ToLower() switch
            {
                "title" => request.SortDescending ? query.OrderByDescending(r => r.TitleEn) : query.OrderBy(r => r.TitleEn),
                "status" => request.SortDescending ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
                "date" => request.SortDescending ? query.OrderByDescending(r => r.SubmittedAt) : query.OrderBy(r => r.SubmittedAt),
                _ => query.OrderByDescending(r => r.CreatedAt)
            };
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        var researches = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ResearchListDto>>(researches);

        return Ok(new PagedResult<ResearchListDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        });
    }

    /// <summary>
    /// Get my submissions (Authenticated user)
    /// </summary>
    [HttpGet("my-submissions")]
    [Authorize]
    [ProducesResponseType(typeof(IEnumerable<ResearchListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySubmissions()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var researches = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors)
            .Where(r => r.SubmitterId == userId.Value)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ResearchListDto>>(researches);
        return Ok(dtos);
    }

    /// <summary>
    /// Get research by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ResearchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id)
    {
        var research = await _context.Researches
            .Include(r => r.Conference)
                .ThenInclude(c => c.ReviewCriteria)
            .Include(r => r.Submitter)
            .Include(r => r.Authors)
            .Include(r => r.Files)
            .Include(r => r.Reviews)
            .Include(r => r.Decision)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        // Check authorization
        var userId = GetCurrentUserId();
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value);
        
        if (research.SubmitterId != userId && 
            !userRoles.Contains("Admin") && 
            !userRoles.Contains("Chairman") &&
            !research.Reviews.Any(r => r.ReviewerId == userId))
        {
            return Forbid();
        }

        // Filter reviews based on role
        if (!userRoles.Contains("Admin") && !userRoles.Contains("Chairman"))
        {
            if (research.SubmitterId == userId)
            {
                // Submitter only sees Chair Approved reviews
                research.Reviews = research.Reviews.Where(r => r.IsChairApproved).ToList();
            }
            else
            {
                // Reviewer only sees their own review
                research.Reviews = research.Reviews.Where(r => r.ReviewerId == userId).ToList();
            }
        }

        var dto = _mapper.Map<ResearchDto>(research);
        return Ok(dto);
    }

    /// <summary>
    /// Create new research submission
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ResearchDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] ResearchCreateRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        // Check conference accepts submissions
        var conference = await _context.Conferences.FindAsync(request.ConferenceId);
        if (conference == null)
            return BadRequest(new { message = "Conference not found | المؤتمر غير موجود" });
        
        if (!conference.AcceptingSubmissions)
            return BadRequest(new { message = "Conference is not accepting submissions | المؤتمر لا يقبل تقديمات حالياً" });
        
        if (conference.SubmissionDeadline < DateTime.UtcNow)
            return BadRequest(new { message = "Submission deadline has passed | انتهى موعد التقديم" });

        var research = _mapper.Map<Research>(request);
        research.SubmitterId = userId.Value;
        research.Status = ResearchStatus.Draft;

        // Add authors
        var order = 1;
        foreach (var authorRequest in request.Authors)
        {
            var author = _mapper.Map<Author>(authorRequest);
            author.ResearchId = research.Id;
            author.Order = order++;
            research.Authors.Add(author);
        }

        _context.Researches.Add(research);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("Create", "Research", research.Id, newValues: new { research.TitleEn, research.ConferenceId });

        var dto = _mapper.Map<ResearchDto>(research);
        return CreatedAtAction(nameof(GetById), new { id = research.Id }, dto);
    }

    /// <summary>
    /// Update research (draft only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ResearchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(Guid id, [FromBody] ResearchUpdateRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var research = await _context.Researches
            .Include(r => r.Authors)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.SubmitterId != userId)
            return Forbid();

        if (research.Status != ResearchStatus.Draft)
            return BadRequest(new { message = "Can only edit draft submissions | يمكن تعديل المسودات فقط" });

        // Update research fields
        research.TitleEn = request.TitleEn;
        research.TitleAr = request.TitleAr;
        research.AbstractEn = request.AbstractEn;
        research.AbstractAr = request.AbstractAr;
        research.Keywords = request.Keywords;
        research.TopicArea = request.TopicArea;
        research.UpdatedAt = DateTime.UtcNow;

        // Update authors
        foreach (var existingAuthor in research.Authors.ToList())
        {
            existingAuthor.IsDeleted = true;
            existingAuthor.DeletedAt = DateTime.UtcNow;
        }

        var order = 1;
        foreach (var authorRequest in request.Authors)
        {
            var author = _mapper.Map<Author>(authorRequest);
            author.ResearchId = research.Id;
            author.Order = order++;
            _context.Authors.Add(author);
        }

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Update", "Research", id);

        // Reload with new data
        research = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .FirstOrDefaultAsync(r => r.Id == id);

        var dto = _mapper.Map<ResearchDto>(research);
        return Ok(dto);
    }

    /// <summary>
    /// Delete research (draft only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var research = await _context.Researches
            .Include(r => r.Authors)
            .Include(r => r.Files)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.SubmitterId != userId)
            return Forbid();

        if (research.Status != ResearchStatus.Draft)
            return BadRequest(new { message = "Can only delete draft submissions | يمكن حذف المسودات فقط" });

        // Soft delete or Hard delete? 
        // For drafts, hard delete is usually fine, but let's stick to soft delete or just removing them if that's the pattern. 
        // Looking at Update, it uses IsDeleted for authors. Let's check BaseEntity.
        // Assuming hard delete for simplicity in drafts unless BaseEntity suggests otherwise.
        // But usually, EF Core Remove does the job.
        
        _context.Researches.Remove(research);
        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Delete", "Research", id);

        return NoContent();
    }

    /// <summary>
    /// Submit research for review
    /// </summary>
    [HttpPost("{id}/submit")]
    [Authorize]
    [ProducesResponseType(typeof(ResearchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Submit(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var research = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors)
            .Include(r => r.Files)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.SubmitterId != userId)
            return Forbid();

        if (research.Status != ResearchStatus.Draft)
            return BadRequest(new { message = "Research already submitted | البحث مقدم بالفعل" });

        // Validate research has required files
        if (!research.Files.Any(f => !f.IsDeleted && f.FileType == "MainDocument"))
            return BadRequest(new { message = "Please upload the main document | يرجى رفع الوثيقة الرئيسية" });

        // Generate submission number
        var count = await _context.Researches.CountAsync(r => r.ConferenceId == research.ConferenceId && r.SubmissionNumber != null);
        research.SubmissionNumber = $"SUB-{DateTime.UtcNow.Year}-{count + 1:D5}";
        research.Status = ResearchStatus.Submitted;
        research.SubmittedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("Submit", "Research", id, newValues: new { research.SubmissionNumber });

        // Notify reviewers about new submission
        await _notificationService.SendToRoleAsync(
            "Reviewer",
            "New Research Submission",
            "تقديم بحث جديد",
            $"A new research '{research.TitleEn}' has been submitted for review",
            $"تم تقديم بحث جديد '{research.TitleAr}'",
            "/reviewer"
        );

        var dto = _mapper.Map<ResearchDto>(research);
        return Ok(dto);
    }

    /// <summary>
    /// Upload file to research
    /// </summary>
    [HttpPost("{id}/files")]
    [Authorize]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB
    [ProducesResponseType(typeof(FileUploadResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadFile(Guid id, IFormFile file, [FromQuery] string fileType = "MainDocument")
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var research = await _context.Researches.FindAsync(id);
        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        if (research.SubmitterId != userId)
            return Forbid();

        if (research.Status != ResearchStatus.Draft && research.Status != ResearchStatus.RevisionRequired)
            return BadRequest(new { message = "Cannot upload files at this stage | لا يمكن رفع الملفات في هذه المرحلة" });

        // Validate file
        if (file.Length == 0)
            return BadRequest(new { message = "File is empty | الملف فارغ" });

        if (file.Length > 100 * 1024 * 1024) // 100MB
            return BadRequest(new { message = "File size exceeds 100MB limit | حجم الملف يتجاوز 100 ميجابايت" });

        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only PDF files are allowed | يُسمح فقط بملفات PDF" });

        // Upload file
        using var stream = file.OpenReadStream();
        var checksum = _fileStorageService.GetFileChecksum(stream);
        stream.Position = 0;
        
        var filePath = await _fileStorageService.UploadFileAsync(stream, file.FileName, file.ContentType, $"research/{id}");

        // Save file record
        var researchFile = new ResearchFile
        {
            ResearchId = id,
            FileName = Path.GetFileName(filePath),
            OriginalFileName = file.FileName,
            FilePath = filePath,
            ContentType = file.ContentType,
            FileSize = file.Length,
            FileType = fileType,
            Checksum = checksum
        };

        _context.ResearchFiles.Add(researchFile);
        await _context.SaveChangesAsync();

        await _auditService.LogAsync("UploadFile", "ResearchFile", researchFile.Id, newValues: new { file.FileName, fileType });

        return CreatedAtAction(nameof(GetById), new { id }, _mapper.Map<FileUploadResponse>(researchFile));
    }

    /// <summary>
    /// Download research file
    /// </summary>
    [HttpGet("{id}/files/{fileId}")]
    [Authorize]
    public async Task<IActionResult> DownloadFile(Guid id, Guid fileId)
    {
        var file = await _context.ResearchFiles
            .Include(f => f.Research)
            .FirstOrDefaultAsync(f => f.Id == fileId && f.ResearchId == id);

        if (file == null)
            return NotFound(new { message = "File not found | الملف غير موجود" });

        // Check authorization
        var userId = GetCurrentUserId();
        var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value);
        
        if (file.Research.SubmitterId != userId && 
            !userRoles.Contains("Admin") && 
            !userRoles.Contains("Chairman"))
        {
            // Check if user is assigned reviewer
            var isReviewer = await _context.Reviews.AnyAsync(r => r.ResearchId == id && r.ReviewerId == userId);
            if (!isReviewer)
                return Forbid();
        }

        var stream = await _fileStorageService.DownloadFileAsync(file.FilePath);
        if (stream == null)
            return NotFound(new { message = "File not found on server | الملف غير موجود على الخادم" });

        return File(stream, file.ContentType, file.OriginalFileName);
    }

    /// <summary>
    /// Get public (approved) researches
    /// </summary>
    [HttpGet("public")]
    [ProducesResponseType(typeof(IEnumerable<PublicResearchDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublicResearches([FromQuery] Guid? conferenceId = null)
    {
        var query = _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .Where(r => r.IsPublic && r.Status == ResearchStatus.Approved);

        if (conferenceId.HasValue)
            query = query.Where(r => r.ConferenceId == conferenceId.Value);

        var researches = await query
            .OrderByDescending(r => r.SubmittedAt)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<PublicResearchDto>>(researches);
        return Ok(dtos);
    }

    /// <summary>
    /// View public research details
    /// </summary>
    [HttpGet("public/{id}")]
    [ProducesResponseType(typeof(PublicResearchDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPublicResearchById(Guid id)
    {
        var research = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors.Where(a => !a.IsDeleted))
            .FirstOrDefaultAsync(r => r.Id == id && r.IsPublic && r.Status == ResearchStatus.Approved);

        if (research == null)
            return NotFound(new { message = "Research not found | البحث غير موجود" });

        // Increment view count
        research.ViewCount++;
        await _context.SaveChangesAsync();

        var dto = _mapper.Map<PublicResearchDto>(research);
        return Ok(dto);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
