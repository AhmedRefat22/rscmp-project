# دليل تشغيل نظام RSCMP
# RSCMP System Startup Guide

## المتطلبات الأساسية | Prerequisites

قبل البدء، تأكد من تثبيت:

1. **.NET 8 SDK** - [تحميل](https://dotnet.microsoft.com/download/dotnet/8.0)
2. **Node.js 18+** - [تحميل](https://nodejs.org/)
3. **SQL Server LocalDB** (يأتي مع Visual Studio) أو SQL Server Express

---

## خطوات التشغيل | Startup Steps

### الخطوة 1: فتح المشروع

```powershell
cd C:\Users\Ahmed Refat\.gemini\antigravity\scratch\RSCMP
```

---

### الخطوة 2: تشغيل الـ Backend (API)

افتح **Terminal جديد** ونفذ:

```powershell
cd C:\Users\Ahmed Refat\.gemini\antigravity\scratch\RSCMP
dotnet run --project src/RSCMP.API/RSCMP.API.csproj --urls=https://localhost:7000
```

**انتظر حتى ترى:**
```
Now listening on: https://localhost:7000
Application started. Press Ctrl+C to shut down.
```

> ⚠️ **ملاحظة:** إذا ظهرت رسالة عن SSL certificate، اضغط "نعم" للموافقة.

---

### الخطوة 3: تشغيل الـ Frontend

افتح **Terminal ثاني** (منفصل) ونفذ:

```powershell
cd C:\Users\Ahmed Refat\.gemini\antigravity\scratch\RSCMP\frontend
npm install   # فقط في المرة الأولى
npm run dev
```

**انتظر حتى ترى:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### الخطوة 4: فتح الموقع

افتح المتصفح وادخل على:
```
http://localhost:5173
```

---

## الحسابات الجاهزة | Ready Accounts

| الدور | البريد الإلكتروني | كلمة المرور |
|-------|-------------------|-------------|
| Admin + الكل | `admin@rscmp.com` | `Admin@123456` |
| Admin + الكل | `Mo@gmail.com` | `Mo@123456` |
| باحث عادي | `john.researcher@email.com` | `User@123456` |

---

## إيقاف النظام | Stopping the System

1. في كل Terminal، اضغط `Ctrl + C`
2. أو أغلق نوافذ الـ Terminal

---

## حل المشاكل الشائعة | Troubleshooting

### مشكلة: Port already in use
```powershell
# إيقاف العمليات على المنفذ 7000
netstat -ano | findstr :7000
taskkill /PID <PID> /F
```

### مشكلة: Database connection error
```powershell
# تأكد من تشغيل SQL Server LocalDB
SqlLocalDB start MSSQLLocalDB
```

### مشكلة: npm install fails
```powershell
# مسح cache وإعادة التثبيت
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## ملخص الأوامر السريع | Quick Commands Summary

```powershell
# Terminal 1 - Backend
cd C:\Users\Ahmed Refat\.gemini\antigravity\scratch\RSCMP
dotnet run --project src/RSCMP.API/RSCMP.API.csproj --urls=https://localhost:7000

# Terminal 2 - Frontend
cd C:\Users\Ahmed Refat\.gemini\antigravity\scratch\RSCMP\frontend
npm run dev
```

ثم افتح: `http://localhost:5173`

---

## هيكل المشروع | Project Structure

```
RSCMP/
├── src/
│   ├── RSCMP.API/          # Backend API (.NET 8)
│   ├── RSCMP.Application/  # Business Logic
│   ├── RSCMP.Domain/       # Entities & Interfaces
│   └── RSCMP.Infrastructure/ # Database & Services
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # الصفحات
│   │   ├── components/    # المكونات
│   │   ├── api/          # خدمات API
│   │   └── store/        # State Management
│   └── vite.config.ts    # إعدادات Vite
└── docs/                  # الوثائق
```
