using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMapper _mapper;
    private readonly IAuditService _auditService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IMapper mapper,
        IAuditService auditService,
        ILogger<AdminController> logger)
    {
        _context = context;
        _userManager = userManager;
        _mapper = mapper;
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet("users")]
    [ProducesResponseType(typeof(PagedResult<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] PagedRequest request, [FromQuery] string? role = null)
    {
        var query = _context.Users.Where(u => !u.IsDeleted).AsQueryable();

        if (!string.IsNullOrEmpty(request.Search))
        {
            query = query.Where(u =>
                u.Email!.Contains(request.Search) ||
                u.FullNameEn.Contains(request.Search) ||
                u.FullNameAr.Contains(request.Search));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var userDtos = new List<UserDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            if (!string.IsNullOrEmpty(role) && !roles.Contains(role))
                continue;
            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles;
            userDtos.Add(userDto);
        }

        return Ok(new PagedResult<UserDto>
        {
            Items = userDtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        });
    }

    /// <summary>
    /// Create a new user (Reviewer or Chairman only)
    /// </summary>
    [HttpPost("users")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserByAdminRequest request)
    {
        // Validate role - only Reviewer or Chairman allowed
        var allowedRoles = new[] { "Reviewer", "Chairman" };
        if (!allowedRoles.Contains(request.Role))
        {
            return BadRequest(new { message = "Can only create Reviewer or Chairman accounts | يمكن إنشاء حسابات المراجعين ورؤساء اللجان فقط" });
        }

        // Check if email already exists
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return BadRequest(new { message = "Email already registered | البريد الإلكتروني مسجل مسبقاً" });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            FullNameEn = request.FullNameEn,
            FullNameAr = request.FullNameAr,
            Institution = request.Institution,
            PreferredLanguage = request.PreferredLanguage,
            EmailConfirmed = true // Admin-created accounts are pre-verified
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(", ", result.Errors.Select(e => e.Description)) });
        }

        // Assign the requested role + Public role
        await _userManager.AddToRoleAsync(user, request.Role);
        await _userManager.AddToRoleAsync(user, "Public");

        // If Chairman, also add Reviewer role
        if (request.Role == "Chairman")
        {
            await _userManager.AddToRoleAsync(user, "Reviewer");
        }

        await _auditService.LogAsync("CreateUser", "User", user.Id, newValues: new { request.Email, request.Role });
        _logger.LogInformation("Admin created new {Role} account: {Email}", request.Role, request.Email);

        var roles = await _userManager.GetRolesAsync(user);
        var dto = _mapper.Map<UserDto>(user);
        dto.Roles = roles;
        
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, dto);
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("users/{id}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
            return NotFound(new { message = "User not found | المستخدم غير موجود" });

        var roles = await _userManager.GetRolesAsync(user);
        var dto = _mapper.Map<UserDto>(user);
        dto.Roles = roles;
        return Ok(dto);
    }

    /// <summary>
    /// Assign role to user
    /// </summary>
    [HttpPost("users/{id}/roles")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] string role)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
            return NotFound(new { message = "User not found | المستخدم غير موجود" });

        if (!await _context.Roles.AnyAsync(r => r.Name == role))
            return BadRequest(new { message = "Invalid role | دور غير صحيح" });

        if (!await _userManager.IsInRoleAsync(user, role))
        {
            await _userManager.AddToRoleAsync(user, role);
            await _auditService.LogAsync("AssignRole", "User", id, newValues: new { role });
        }

        return Ok(new { message = "Role assigned successfully | تم تعيين الدور بنجاح" });
    }

    /// <summary>
    /// Remove role from user
    /// </summary>
    [HttpDelete("users/{id}/roles/{role}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> RemoveRole(Guid id, string role)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
            return NotFound(new { message = "User not found | المستخدم غير موجود" });

        if (await _userManager.IsInRoleAsync(user, role))
        {
            await _userManager.RemoveFromRoleAsync(user, role);
            await _auditService.LogAsync("RemoveRole", "User", id, oldValues: new { role });
        }

        return NoContent();
    }

    /// <summary>
    /// Delete user (soft delete)
    /// </summary>
    [HttpDelete("users/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user == null || user.IsDeleted)
            return NotFound(new { message = "User not found | المستخدم غير موجود" });

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
        await _auditService.LogAsync("DeleteUser", "User", id);

        return NoContent();
    }

    /// <summary>
    /// Get system settings
    /// </summary>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(IEnumerable<SystemSetting>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSettings([FromQuery] string? category = null)
    {
        var query = _context.SystemSettings.AsQueryable();
        
        if (!string.IsNullOrEmpty(category))
            query = query.Where(s => s.Category == category);

        var settings = await query.OrderBy(s => s.Category).ThenBy(s => s.Key).ToListAsync();
        return Ok(settings);
    }

    /// <summary>
    /// Update system setting
    /// </summary>
    [HttpPut("settings/{key}")]
    [ProducesResponseType(typeof(SystemSetting), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] string value)
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
        if (setting == null)
            return NotFound(new { message = "Setting not found | الإعداد غير موجود" });

        var oldValue = setting.Value;
        setting.Value = value;
        setting.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("UpdateSetting", "SystemSetting", setting.Id, oldValues: new { key, oldValue }, newValues: new { key, value });

        return Ok(setting);
    }

    /// <summary>
    /// Get audit logs
    /// </summary>
    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(PagedResult<AuditLog>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] PagedRequest request, [FromQuery] string? action = null, [FromQuery] string? entityType = null)
    {
        var query = _context.AuditLogs
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(action))
            query = query.Where(a => a.Action == action);

        if (!string.IsNullOrEmpty(entityType))
            query = query.Where(a => a.EntityType == entityType);

        var totalCount = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return Ok(new PagedResult<AuditLog>
        {
            Items = logs,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        });
    }

    /// <summary>
    /// Get contact messages
    /// </summary>
    [HttpGet("contact-messages")]
    [ProducesResponseType(typeof(PagedResult<ContactMessageDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetContactMessages([FromQuery] PagedRequest request, [FromQuery] ContactMessageStatus? status = null)
    {
        var query = _context.ContactMessages.AsQueryable();

        if (status.HasValue)
            query = query.Where(m => m.Status == status.Value);

        var totalCount = await query.CountAsync();

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        var dtos = _mapper.Map<IEnumerable<ContactMessageDto>>(messages);

        return Ok(new PagedResult<ContactMessageDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        });
    }

    /// <summary>
    /// Reply to contact message
    /// </summary>
    [HttpPost("contact-messages/{id}/reply")]
    [ProducesResponseType(typeof(ContactMessageDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReplyToContactMessage(Guid id, [FromBody] string response)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var message = await _context.ContactMessages.FindAsync(id);
        if (message == null)
            return NotFound(new { message = "Message not found | الرسالة غير موجودة" });

        message.Response = response;
        message.RespondedById = userId;
        message.RespondedAt = DateTime.UtcNow;
        message.Status = ContactMessageStatus.Replied;

        await _context.SaveChangesAsync();
        await _auditService.LogAsync("ReplyContactMessage", "ContactMessage", id);

        // TODO: Send email to user

        var dto = _mapper.Map<ContactMessageDto>(message);
        return Ok(dto);
    }

    /// <summary>
    /// Get dashboard statistics
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard()
    {
        var now = DateTime.UtcNow;

        var dashboard = new AdminDashboardDto
        {
            TotalConferences = await _context.Conferences.CountAsync(),
            ActiveConferences = await _context.Conferences.CountAsync(c => c.IsActive && c.EndDate >= now),
            TotalResearches = await _context.Researches.CountAsync(),
            PendingResearches = await _context.Researches.CountAsync(r => r.Status == ResearchStatus.Submitted || r.Status == ResearchStatus.UnderReview),
            TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted),
            TotalReviewers = await _context.UserRoles.CountAsync(ur => ur.RoleId == _context.Roles.Where(r => r.Name == "Reviewer").Select(r => r.Id).FirstOrDefault()),
            UnreadMessages = await _context.ContactMessages.CountAsync(m => m.Status == ContactMessageStatus.New),
            RecentActivities = await GetRecentActivitiesAsync()
        };

        return Ok(dashboard);
    }

    private async Task<IEnumerable<RecentActivityDto>> GetRecentActivitiesAsync()
    {
        var logs = await _context.AuditLogs
            .Include(a => a.User)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToListAsync();

        return logs.Select(l => new RecentActivityDto
        {
            Action = l.Action,
            Entity = l.EntityType,
            Timestamp = l.CreatedAt,
            Details = l.User?.FullNameEn
        });
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
