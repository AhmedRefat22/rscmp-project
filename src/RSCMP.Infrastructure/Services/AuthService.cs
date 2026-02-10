using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using AutoMapper;
using RSCMP.Application.DTOs;
using RSCMP.Application.Interfaces;
using RSCMP.Domain.Entities;
using RSCMP.Domain.Interfaces;

namespace RSCMP.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly IMapper _mapper;
    private readonly IAuditService _auditService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration,
        IMapper mapper,
        IAuditService auditService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _mapper = mapper;
        _auditService = auditService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            await _auditService.LogAsync("FailedLogin", "User", Guid.Empty, additionalInfo: $"User not found for email: {request.Email}");
            throw new UnauthorizedAccessException("Invalid email or password | بريد إلكتروني أو كلمة مرور غير صحيحة");
        }

        if (user.IsDeleted)
        {
             await _auditService.LogAsync("FailedLogin", "User", user.Id, additionalInfo: "User is deleted");
             throw new UnauthorizedAccessException("Account is disabled | الحساب معطل");
        }

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
        {
            await _auditService.LogAsync("FailedLogin", "User", user.Id, additionalInfo: "Invalid password");
            throw new UnauthorizedAccessException("Invalid email or password | بريد إلكتروني أو كلمة مرور غير صحيحة");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, expiresAt) = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(request.RememberMe ? 30 : 7);
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        await _auditService.LogAsync("Login", "User", user.Id);

        var userDto = _mapper.Map<UserDto>(user);
        userDto.Roles = roles;
        return new AuthResponse(accessToken, refreshToken, expiresAt, userDto);
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
            throw new InvalidOperationException("Email already registered | البريد الإلكتروني مسجل بالفعل");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            FullNameEn = request.FullNameEn,
            FullNameAr = request.FullNameAr,
            Institution = request.Institution,
            PreferredLanguage = request.PreferredLanguage,
            EmailConfirmed = true // For now, auto-confirm
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            throw new InvalidOperationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        // Assign default Researcher role for all public registrations
        await _userManager.AddToRoleAsync(user, "Researcher");

        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, expiresAt) = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        await _auditService.LogAsync("Register", "User", user.Id);

        var userDto = _mapper.Map<UserDto>(user);
        userDto.Roles = roles;
        return new AuthResponse(accessToken, refreshToken, expiresAt, userDto);
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var principal = GetPrincipalFromExpiredToken(request.AccessToken);
        var userId = Guid.Parse(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());
        
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.IsDeleted || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            throw new UnauthorizedAccessException("Invalid refresh token | رمز التحديث غير صالح");

        var roles = await _userManager.GetRolesAsync(user);
        var (accessToken, expiresAt) = GenerateAccessToken(user, roles);
        var refreshToken = GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        var userDto = _mapper.Map<UserDto>(user);
        userDto.Roles = roles;
        return new AuthResponse(accessToken, refreshToken, expiresAt, userDto);
    }

    public async Task LogoutAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiryTime = null;
            await _userManager.UpdateAsync(user);
            await _auditService.LogAsync("Logout", "User", user.Id);
        }
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            throw new InvalidOperationException("User not found | المستخدم غير موجود");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException("Current password is incorrect | كلمة المرور الحالية غير صحيحة");

        await _auditService.LogAsync("ChangePassword", "User", user.Id);
        return true;
    }

    public async Task<bool> RequestPasswordResetAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || user.IsDeleted)
            return true; // Don't reveal if user exists

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        // TODO: Send email with token
        await _auditService.LogAsync("RequestPasswordReset", "User", user.Id);
        return true;
    }

    public async Task<bool> ConfirmPasswordResetAsync(ResetPasswordConfirmRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || user.IsDeleted)
            throw new InvalidOperationException("Invalid request | طلب غير صالح");

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException("Invalid or expired token | رمز غير صالح أو منتهي الصلاحية");

        await _auditService.LogAsync("ConfirmPasswordReset", "User", user.Id);
        return true;
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.IsDeleted)
            throw new InvalidOperationException("User not found | المستخدم غير موجود");

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = _mapper.Map<UserDto>(user);
        userDto.Roles = roles;
        return userDto;
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UserProfileUpdateRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.IsDeleted)
            throw new InvalidOperationException("User not found | المستخدم غير موجود");

        user.FullNameEn = request.FullNameEn;
        user.FullNameAr = request.FullNameAr;
        user.Institution = request.Institution;
        user.Department = request.Department;
        user.AcademicTitle = request.AcademicTitle;
        user.Bio = request.Bio;
        user.PreferredLanguage = request.PreferredLanguage;
        user.UpdatedAt = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);
        await _auditService.LogAsync("UpdateProfile", "User", user.Id);

        var roles = await _userManager.GetRolesAsync(user);
        var userDto = _mapper.Map<UserDto>(user);
        userDto.Roles = roles;
        return userDto;
    }

    public async Task<IEnumerable<string>> GetUserRolesAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return Enumerable.Empty<string>();
        return await _userManager.GetRolesAsync(user);
    }

    public async Task<bool> ValidateRoleAsync(Guid userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null || user.IsDeleted)
            return false;
        return await _userManager.IsInRoleAsync(user, role);
    }

    private (string token, DateTime expiresAt) GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        var expiresAt = DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationMinutes"]!));

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, user.FullNameEn),
            new("FullNameAr", user.FullNameAr),
            new("Language", user.PreferredLanguage.ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            ValidateLifetime = false,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"]
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken || 
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token");

        return principal;
    }
}
