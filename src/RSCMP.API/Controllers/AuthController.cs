using Microsoft.AspNetCore.Mvc;
using RSCMP.Application.DTOs;
using RSCMP.Application.Interfaces;

namespace RSCMP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Login with email and password
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);
            var response = await _authService.LoginAsync(request);
            _logger.LogInformation("Login successful for email: {Email}", request.Email);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Failed login attempt for {Email}", request.Email);
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return CreatedAtAction(nameof(Register), response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Refresh access token
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Logout (invalidate refresh token)
    /// </summary>
    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdClaim != null && Guid.TryParse(userIdClaim, out var userId))
        {
            await _authService.LogoutAsync(userId);
        }
        return NoContent();
    }

    /// <summary>
    /// Get current user profile
    /// </summary>
    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var user = await _authService.GetCurrentUserAsync(userId.Value);
        return Ok(user);
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    [HttpPut("profile")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UserProfileUpdateRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        try
        {
            var user = await _authService.UpdateProfileAsync(userId.Value, request);
            return Ok(user);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Change password
    /// </summary>
    [HttpPost("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        try
        {
            await _authService.ChangePasswordAsync(userId.Value, request);
            return Ok(new { message = "Password changed successfully | تم تغيير كلمة المرور بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Request password reset
    /// </summary>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ForgotPassword([FromBody] ResetPasswordRequest request)
    {
        await _authService.RequestPasswordResetAsync(request);
        return Ok(new { message = "If your email is registered, you will receive a password reset link | إذا كان بريدك الإلكتروني مسجلاً، ستتلقى رابط إعادة تعيين كلمة المرور" });
    }

    /// <summary>
    /// Confirm password reset
    /// </summary>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordConfirmRequest request)
    {
        try
        {
            await _authService.ConfirmPasswordResetAsync(request);
            return Ok(new { message = "Password reset successfully | تم إعادة تعيين كلمة المرور بنجاح" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get user roles
    /// </summary>
    [HttpGet("roles")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var roles = await _authService.GetUserRolesAsync(userId.Value);
        return Ok(roles);
    }

    /// <summary>
    /// Select active role for session
    /// </summary>
    [HttpPost("select-role")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SelectRole([FromBody] RoleSelectionRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var isValid = await _authService.ValidateRoleAsync(userId.Value, request.Role);
        if (!isValid)
            return Forbid();

        // Return success - frontend will handle role-based navigation
        return Ok(new { role = request.Role, message = "Role selected successfully | تم اختيار الدور بنجاح" });
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return userIdClaim != null && Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
