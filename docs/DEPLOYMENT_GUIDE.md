# RSCMP Deployment Guide

## Prerequisites

- **.NET 8.0 SDK** or later
- **Node.js 18+** and npm
- **SQL Server 2019+** or Azure SQL Database
- **IIS** (Windows) or **nginx** (Linux) for hosting
- **SSL Certificate** for HTTPS

---

## Backend Deployment

### 1. Build the Application

```bash
cd RSCMP/backend
dotnet restore
dotnet publish -c Release -o ./publish
```

### 2. Database Setup

Update connection string in `appsettings.Production.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=your-server;Database=RSCMP;User Id=sa;Password=YourPassword;TrustServerCertificate=true"
  }
}
```

Apply migrations:

```bash
dotnet ef database update --project RSCMP.Infrastructure --startup-project RSCMP.Api
```

### 3. Configure Environment Variables

Set the following environment variables:

```bash
ASPNETCORE_ENVIRONMENT=Production
JWT__SecretKey=your-256-bit-secret-key-here-minimum-32-characters
JWT__Issuer=https://your-domain.com
JWT__Audience=https://your-domain.com
```

### 4. IIS Deployment (Windows)

1. Install the **.NET Hosting Bundle**
2. Create new IIS website pointing to `./publish` folder
3. Set Application Pool to "No Managed Code"
4. Configure HTTPS binding with SSL certificate
5. Start the application pool

### 5. Linux Deployment (systemd)

Create service file `/etc/systemd/system/rscmp.service`:

```ini
[Unit]
Description=RSCMP API Service
After=network.target

[Service]
WorkingDirectory=/var/www/rscmp
ExecStart=/usr/bin/dotnet RSCMP.Api.dll
Restart=always
RestartSec=10
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://localhost:5000

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable rscmp
sudo systemctl start rscmp
```

Configure nginx reverse proxy:

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Frontend Deployment

### 1. Build for Production

```bash
cd RSCMP/frontend
npm install
npm run build
```

This creates optimized files in `./dist` folder.

### 2. Configure API Base URL

Create/update `.env.production`:

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

### 3. Static File Hosting

Deploy `./dist` contents to:
- **nginx/Apache** static file server
- **Azure Static Web Apps**
- **Vercel/Netlify**
- **AWS S3 + CloudFront**

nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    root /var/www/rscmp-frontend;
    index index.html;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY publish/ .
EXPOSE 80
ENTRYPOINT ["dotnet", "RSCMP.Api.dll"]
```

### Frontend Dockerfile

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "5000:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=db;Database=RSCMP;User Id=sa;Password=YourPassword
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrongPassword123!
    volumes:
      - sqldata:/var/opt/mssql

volumes:
  sqldata:
```

---

## Health Checks

The API exposes health check endpoints:

- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (includes database)

---

## Monitoring

Recommended monitoring setup:

1. **Application Insights** (Azure) or **Serilog + Seq**
2. **Prometheus + Grafana** for metrics
3. **Health check monitoring** with uptime services

---

## Backup Strategy

1. **Database**: Daily automated backups with 30-day retention
2. **Uploaded Files**: Sync to cloud storage (Azure Blob, AWS S3)
3. **Configuration**: Store in version control (secrets excluded)
