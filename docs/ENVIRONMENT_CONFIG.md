# RSCMP Environment Configuration Guide

## Overview

This guide explains all configuration options for the RSCMP platform across different environments.

---

## Backend Configuration

### appsettings.json Structure

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RSCMP;Trusted_Connection=true;TrustServerCertificate=true"
  },
  "JWT": {
    "SecretKey": "your-secret-key-minimum-32-characters-long",
    "Issuer": "https://localhost:7000",
    "Audience": "https://localhost:5173",
    "AccessTokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "CORS": {
    "AllowedOrigins": ["https://localhost:5173"]
  },
  "FileUpload": {
    "MaxFileSizeMB": 10,
    "AllowedExtensions": [".pdf"],
    "StoragePath": "./uploads"
  },
  "RateLimiting": {
    "PermitLimit": 100,
    "WindowSeconds": 60
  },
  "Email": {
    "SmtpHost": "smtp.example.com",
    "SmtpPort": 587,
    "SmtpUser": "noreply@example.com",
    "SmtpPassword": "<from-env>",
    "FromAddress": "noreply@example.com",
    "FromName": "RSCMP Platform"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

---

## Environment-Specific Settings

### Development (appsettings.Development.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RSCMP_Dev;Trusted_Connection=true;TrustServerCertificate=true"
  },
  "JWT": {
    "SecretKey": "development-secret-key-for-testing-only-32-chars"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

### Production (appsettings.Production.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "<from-environment-variable>"
  },
  "JWT": {
    "SecretKey": "<from-environment-variable>",
    "Issuer": "https://api.your-domain.com",
    "Audience": "https://your-domain.com"
  },
  "CORS": {
    "AllowedOrigins": ["https://your-domain.com"]
  },
  "FileUpload": {
    "StoragePath": "/var/data/rscmp/uploads"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Error"
    }
  }
}
```

---

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | Yes | Development |
| `ConnectionStrings__DefaultConnection` | Database connection string | Yes | - |
| `JWT__SecretKey` | JWT signing key (min 32 chars) | Yes | - |
| `JWT__Issuer` | JWT issuer URL | No | https://localhost:7000 |
| `JWT__Audience` | JWT audience URL | No | https://localhost:5173 |
| `Email__SmtpPassword` | SMTP password | No | - |

### Setting Environment Variables

**Windows (PowerShell):**
```powershell
$env:ASPNETCORE_ENVIRONMENT = "Production"
$env:JWT__SecretKey = "your-super-secret-key-minimum-32-characters"
$env:ConnectionStrings__DefaultConnection = "Server=...;Database=..."
```

**Linux/macOS:**
```bash
export ASPNETCORE_ENVIRONMENT=Production
export JWT__SecretKey="your-super-secret-key-minimum-32-characters"
export ConnectionStrings__DefaultConnection="Server=...;Database=..."
```

**Docker:**
```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Production
  - JWT__SecretKey=your-super-secret-key-minimum-32-characters
  - ConnectionStrings__DefaultConnection=Server=db;Database=RSCMP
```

---

## Frontend Configuration

### Environment Files

#### .env.development
```env
VITE_API_BASE_URL=https://localhost:7000
VITE_APP_NAME=RSCMP
VITE_DEFAULT_LANGUAGE=en
```

#### .env.production
```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_NAME=RSCMP
VITE_DEFAULT_LANGUAGE=en
```

### Vite Configuration (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://localhost:7000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

---

## Database Configuration

### SQL Server Connection Strings

**Local with Windows Auth:**
```
Server=localhost;Database=RSCMP;Trusted_Connection=true;TrustServerCertificate=true
```

**Local with SQL Auth:**
```
Server=localhost;Database=RSCMP;User Id=sa;Password=YourPassword;TrustServerCertificate=true
```

**Azure SQL:**
```
Server=tcp:your-server.database.windows.net,1433;Database=RSCMP;User ID=admin@your-server;Password=YourPassword;Encrypt=true;Connection Timeout=30
```

### Running Migrations

```bash
# Development
dotnet ef database update

# Production (from publish folder)
dotnet ef database update --connection "<connection-string>"
```

---

## Logging Configuration

### Serilog (Recommended for Production)

```json
{
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft.AspNetCore": "Warning"
      }
    },
    "WriteTo": [
      {
        "Name": "Console"
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/rscmp-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 30
        }
      }
    ]
  }
}
```

---

## CORS Configuration

### Single Origin
```json
{
  "CORS": {
    "AllowedOrigins": ["https://your-domain.com"]
  }
}
```

### Multiple Origins
```json
{
  "CORS": {
    "AllowedOrigins": [
      "https://your-domain.com",
      "https://admin.your-domain.com"
    ]
  }
}
```

---

## Quick Start Checklist

### Development
1. Copy `appsettings.Development.json` template
2. Update database connection string
3. Run `dotnet ef database update`
4. Run `dotnet run`
5. Frontend: `npm install && npm run dev`

### Production
1. Set environment variables (JWT key, connection string)
2. Configure CORS for production domain
3. Set `ASPNETCORE_ENVIRONMENT=Production`
4. Build and deploy
5. Verify health check endpoint responds: `GET /health`
