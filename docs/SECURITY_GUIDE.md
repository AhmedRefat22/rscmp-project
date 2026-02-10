# RSCMP Security Guide

## Overview

This guide documents the security measures implemented in the RSCMP platform and best practices for maintaining a secure deployment.

---

## Authentication & Authorization

### JWT Token Security

- **Algorithm**: HS256 with 256-bit secret key
- **Access Token Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days
- **Refresh Token Rotation**: New refresh token issued on each refresh

**Best Practices:**
- Store tokens securely (HTTP-only cookies or secure storage)
- Never expose tokens in URLs
- Implement token revocation on logout

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| User | Submit research, view own submissions, manage profile |
| Reviewer | Above + review assigned submissions |
| Chairman | Above + make final decisions on research |
| Admin | Full system access, user management, settings |

---

## OWASP Top 10 Mitigations

### 1. Injection Prevention
- **Parameterized queries** via Entity Framework Core
- **Input validation** with Data Annotations and FluentValidation
- **Output encoding** for all user-generated content

### 2. Broken Authentication
- **Password hashing** with ASP.NET Core Identity (PBKDF2)
- **Account lockout** after 5 failed attempts
- **Rate limiting** on authentication endpoints
- **Secure password policy** (min 8 chars, uppercase, lowercase, digit)

### 3. Sensitive Data Exposure
- **HTTPS enforced** in production
- **Sensitive data encryption** at rest
- **No sensitive data in logs** or error messages
- **Secure headers** (HSTS, X-Content-Type-Options, etc.)

### 4. XML External Entities (XXE)
- XML parsing disabled or safely configured
- JSON used for all API communication

### 5. Broken Access Control
- **Authorization checks** on all protected endpoints
- **Resource ownership verification** before access
- **JWT claims validation** on each request

### 6. Security Misconfiguration
- **Detailed errors disabled** in production
- **Default credentials removed**
- **Secure default headers** configured
- **CORS restricted** to allowed origins

### 7. Cross-Site Scripting (XSS)
- **React auto-escapes** output by default
- **Content-Security-Policy** header configured
- **X-XSS-Protection** header enabled
- **No dangerouslySetInnerHTML** usage

### 8. Insecure Deserialization
- **Type validation** on all deserialized objects
- **No binary serialization** of untrusted data

### 9. Using Components with Known Vulnerabilities
- **Regular dependency updates** via Dependabot/npm audit
- **Security scanning** integrated in CI/CD

### 10. Insufficient Logging & Monitoring
- **Audit logging** for all critical operations
- **Failed authentication logging**
- **Rate limit violation logging**
- **Centralized log management** recommended

---

## Security Headers

The following security headers are applied to all responses:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
```

---

## Input Validation

### Server-Side Validation

All inputs are validated with:
- **Data type validation**
- **Length constraints**
- **Pattern matching** (regex for email, etc.)
- **Business rule validation**

### File Upload Security

- **Allowed types**: PDF only
- **Max size**: 10MB
- **Content verification**: Magic bytes checked
- **Filename sanitization**: Generated UUIDs
- **Storage**: Outside web root

---

## Rate Limiting

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| API (Anonymous) | 100 requests | 1 minute |
| API (Authenticated) | 300 requests | 1 minute |
| File Upload | 5 requests | 1 minute |

---

## Database Security

- **Parameterized queries** prevent SQL injection
- **Least privilege** database user account
- **Connection encryption** enabled
- **Regular backups** with encryption
- **Sensitive data encryption** at rest

---

## Secrets Management

**Never commit secrets to version control!**

Use environment variables or secure vaults:

```bash
# Production secrets
JWT__SecretKey=<from-azure-key-vault>
ConnectionStrings__DefaultConnection=<from-azure-key-vault>
```

Recommended solutions:
- **Azure Key Vault**
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Environment variables** (minimum)

---

## Audit Logging

All critical actions are logged:

| Action | Logged Data |
|--------|-------------|
| Login/Logout | User ID, IP, Timestamp, Success/Failure |
| Research Submit | User ID, Research ID, Timestamp |
| Review Complete | Reviewer ID, Research ID, Scores |
| Decision Made | Chairman ID, Research ID, Decision |
| Role Assignment | Admin ID, Target User, Role |
| Settings Change | Admin ID, Setting Key, Old/New Values |

Logs are stored in database with 90-day retention.

---

## Incident Response

### If credentials are compromised:
1. Immediately rotate JWT secret key
2. Invalidate all refresh tokens
3. Force password reset for affected users
4. Review audit logs for unauthorized access
5. Notify affected users

### If data breach is detected:
1. Isolate affected systems
2. Preserve evidence for forensics
3. Assess scope of breach
4. Notify authorities as required by law
5. Notify affected users
6. Implement remediation measures

---

## Security Checklist

- [ ] Change default admin password (Current: "Admin@123456" - CHANGE IMMEDIATELY IN PROD)
- [x] Configure strong JWT secret (Configured in appsettings.json)
- [x] Enable HTTPS with valid certificate (Enforced via UseHttpsRedirection)
- [x] Configure CORS for production domain only (Configurable via CorsOrigins setting)
- [x] Set up rate limiting (Implemented: 100 req/min per IP/User)
- [x] Enable audit logging (Implemented via AuditService)
- [x] Configure centralized log management (Serilog configured for Console & File)
- [ ] Set up security monitoring alerts (Infrastructure requirement)
- [ ] Regular security updates schedule (Operational requirement)
- [ ] Regular penetration testing schedule (Operational requirement)
