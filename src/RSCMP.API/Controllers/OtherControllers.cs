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
public class ContactController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly IEmailService _emailService;
    private readonly ILogger<ContactController> _logger;

    public ContactController(
        ApplicationDbContext context,
        IMapper mapper,
        IEmailService emailService,
        ILogger<ContactController> logger)
    {
        _context = context;
        _mapper = mapper;
        _emailService = emailService;
        _logger = logger;
    }

    /// <summary>
    /// Submit contact form (Public)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] ContactCreateRequest request)
    {
        var message = _mapper.Map<ContactMessage>(request);
        message.IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        _context.ContactMessages.Add(message);
        await _context.SaveChangesAsync();

        // TODO: Send notification email to admin
        _logger.LogInformation("New contact message from {Email}: {Subject}", request.Email, request.Subject);

        return CreatedAtAction(nameof(Create), new { id = message.Id }, new { message = "Message sent successfully | تم إرسال الرسالة بنجاح" });
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<NotificationsController> _logger;

    public NotificationsController(
        ApplicationDbContext context,
        IMapper mapper,
        ILogger<NotificationsController> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get my notifications
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications([FromQuery] bool unreadOnly = false)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var query = _context.Notifications.Where(n => n.UserId == userId.Value);
        
        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<NotificationDto>>(notifications);
        return Ok(dtos);
    }

    /// <summary>
    /// Get unread count
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var count = await _context.Notifications.CountAsync(n => n.UserId == userId.Value && !n.IsRead);
        return Ok(count);
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPost("{id}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId.Value);
        if (notification == null)
            return NotFound();

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId.Value && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public DashboardController(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    /// <summary>
    /// Get reviewer dashboard
    /// </summary>
    [HttpGet("reviewer")]
    [Authorize(Policy = "ReviewerOnly")]
    [ProducesResponseType(typeof(ReviewerDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviewerDashboard()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var reviews = await _context.Reviews
            .Include(r => r.Research)
                .ThenInclude(res => res.Conference)
            .Where(r => r.ReviewerId == userId.Value)
            .ToListAsync();

        var pendingReviews = reviews.Where(r => r.Status == ReviewStatus.Pending || r.Status == ReviewStatus.InProgress).ToList();

        var dashboard = new ReviewerDashboardDto
        {
            PendingReviews = pendingReviews.Count,
            CompletedReviews = reviews.Count(r => r.Status == ReviewStatus.Completed),
            TotalAssigned = reviews.Count,
            UpcomingReviews = _mapper.Map<IEnumerable<ReviewDto>>(pendingReviews.OrderBy(r => r.DueDate).Take(5))
        };

        return Ok(dashboard);
    }

    /// <summary>
    /// Get chairman dashboard
    /// </summary>
    [HttpGet("chairman")]
    [Authorize(Policy = "ChairmanOnly")]
    [ProducesResponseType(typeof(ChairmanDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChairmanDashboard()
    {
        var researches = await _context.Researches
            .Include(r => r.Conference)
            .Include(r => r.Authors)
            .ToListAsync();

        var pendingDecisions = researches.Where(r => r.Status == ResearchStatus.ReviewCompleted).ToList();

        var dashboard = new ChairmanDashboardDto
        {
            PendingDecisions = pendingDecisions.Count,
            ApprovedResearches = researches.Count(r => r.Status == ResearchStatus.Approved),
            RejectedResearches = researches.Count(r => r.Status == ResearchStatus.Rejected),
            TotalResearches = researches.Count,
            PendingResearches = _mapper.Map<IEnumerable<ResearchListDto>>(pendingDecisions.OrderBy(r => r.SubmittedAt).Take(10))
        };

        return Ok(dashboard);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
