# RSCMP API Documentation

## Overview

The Research & Scientific Conference Management Platform (RSCMP) API is a RESTful API built with ASP.NET Core 8.0. It provides endpoints for managing conferences, research submissions, reviews, and user authentication.

**Base URL:** `https://localhost:7000/api`

## Authentication

All protected endpoints require a JWT Bearer token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Endpoints

#### POST /api/auth/login
Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expiresAt": "2026-02-08T22:00:00Z",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "fullNameEn": "John Doe",
    "fullNameAr": "جون دو",
    "roles": ["User", "Reviewer"]
  }
}
```

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "fullNameEn": "John Doe",
  "fullNameAr": "جون دو",
  "institution": "University",
  "preferredLanguage": "en"
}
```

#### POST /api/auth/refresh-token
Refresh access token using refresh token.

#### POST /api/auth/logout
Logout and invalidate tokens.

---

## Conferences

#### GET /api/conferences
Get all conferences (paginated).

**Query Parameters:**
- `pageNumber` (int): Page number (default: 1)
- `pageSize` (int): Items per page (default: 10)
- `search` (string): Search term
- `activeOnly` (bool): Filter active conferences only

**Response:**
```json
{
  "items": [
    {
      "id": "guid",
      "nameEn": "Conference Name",
      "nameAr": "اسم المؤتمر",
      "startDate": "2026-03-01T00:00:00Z",
      "endDate": "2026-03-05T00:00:00Z",
      "submissionDeadline": "2026-02-15T00:00:00Z",
      "isActive": true,
      "acceptingSubmissions": true
    }
  ],
  "totalCount": 50,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

#### GET /api/conferences/{id}
Get conference details by ID.

#### POST /api/conferences (Admin only)
Create a new conference.

#### PUT /api/conferences/{id} (Admin only)
Update conference details.

#### DELETE /api/conferences/{id} (Admin only)
Delete a conference.

---

## Research Submissions

#### GET /api/research/my-submissions
Get current user's research submissions.

#### GET /api/research/{id}
Get research details by ID.

#### POST /api/research
Create a new research submission.

**Request:**
```json
{
  "conferenceId": "guid",
  "titleEn": "Research Title",
  "titleAr": "عنوان البحث",
  "abstractEn": "Abstract...",
  "abstractAr": "الملخص...",
  "keywords": "AI, Machine Learning",
  "topicArea": "Artificial Intelligence",
  "authors": [
    {
      "fullNameEn": "Author Name",
      "fullNameAr": "اسم المؤلف",
      "email": "author@example.com",
      "isCorresponding": true
    }
  ]
}
```

#### PUT /api/research/{id}
Update research submission.

#### POST /api/research/{id}/submit
Submit research for review.

#### POST /api/research/{id}/upload
Upload research file (PDF only, max 10MB).

**Request:** `multipart/form-data` with file field.

---

## Reviews (Reviewer Role)

#### GET /api/reviews/assigned
Get reviews assigned to current reviewer.

#### GET /api/reviews/{id}
Get review details.

#### POST /api/reviews/{id}/start
Start reviewing (changes status to InProgress).

#### POST /api/reviews/{id}/submit
Submit completed review.

**Request:**
```json
{
  "scores": [
    {
      "criteriaId": "guid",
      "score": 85,
      "comment": "Well written"
    }
  ],
  "commentsToAuthor": "Good research...",
  "commentsToChairman": "Recommend approval",
  "recommendation": "Approved"
}
```

#### POST /api/reviews/{id}/decline
Decline review assignment.

---

## Decisions (Chairman Role)

#### GET /api/decisions/pending
Get research submissions pending decision.

#### GET /api/decisions/research/{researchId}
Get research details with review summary for decision.

#### POST /api/decisions
Create final decision on research.

**Request:**
```json
{
  "researchId": "guid",
  "decision": "Approved",
  "justification": "Meets all criteria",
  "commentsToAuthor": "Congratulations..."
}
```

---

## Admin Endpoints

#### GET /api/admin/dashboard
Get admin dashboard statistics.

#### GET /api/admin/users
Get all users (paginated).

#### POST /api/admin/users/{userId}/roles/{role}
Assign role to user.

#### DELETE /api/admin/users/{userId}/roles/{role}
Remove role from user.

#### GET /api/admin/settings
Get system settings.

#### PUT /api/admin/settings
Update system settings.

---

## Notifications

#### GET /api/notifications
Get current user's notifications.

#### PUT /api/notifications/{id}/read
Mark notification as read.

#### PUT /api/notifications/read-all
Mark all notifications as read.

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "errors": {
    "fieldName": ["Validation error message"]
  }
}
```

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

API requests are rate-limited to:
- **100 requests per minute** per IP for anonymous requests
- **300 requests per minute** per user for authenticated requests

Rate limit headers are included in responses:
```http
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 95
X-Rate-Limit-Reset: 1707426000
```
