// User types
export interface User {
    id: string;
    email: string;
    phoneNumber?: string;
    fullNameEn: string;
    fullNameAr: string;
    institution?: string;
    preferredLanguage: 'en' | 'ar';
    roles: string[];
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
    fullNameEn: string;
    fullNameAr: string;
    phoneNumber: string;
    institution?: string;
    preferredLanguage: 'en' | 'ar';
}

// Admin-only: Create Reviewer or Chairman
export interface CreateUserByAdminRequest {
    email: string;
    password: string;
    fullNameEn: string;
    fullNameAr: string;
    phoneNumber: string;
    institution?: string;
    role: 'Reviewer' | 'Chairman';
    preferredLanguage: 'en' | 'ar';
}

// Conference types
export interface Conference {
    id: string;
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    startDate: string;
    endDate: string;
    submissionDeadline: string;
    reviewDeadline: string;
    location?: string;
    website?: string;
    isActive: boolean;
    acceptingSubmissions: boolean;
    researchCount: number;
    logoUrl?: string;
    bannerUrl?: string;
}

// Research types
export type ResearchStatus =
    | 'Draft'
    | 'Submitted'
    | 'UnderReview'
    | 'ReviewCompleted'
    | 'Approved'
    | 'Rejected'
    | 'RevisionRequired';

export interface Author {
    fullNameEn: string;
    fullNameAr: string;
    email: string;
    institution?: string;
    isCorresponding: boolean;
}

export interface ResearchFile {
    id: string;
    fileName: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
}

export interface Research {
    id: string;
    titleEn: string;
    titleAr: string;
    abstractEn?: string;
    abstractAr?: string;
    keywords?: string;
    topicArea?: string;
    status: ResearchStatus;
    submissionNumber?: string;
    submittedAt?: string;
    conferenceId: string;
    conferenceName?: string;
    authors: Author[];
    files: ResearchFile[];
    conference?: {
        id: string;
        nameEn: string;
        nameAr: string;
        reviewCriteria?: ReviewCriteria[];
    };
}

export interface ResearchCreateRequest {
    conferenceId: string;
    titleEn: string;
    titleAr: string;
    abstractEn?: string;
    abstractAr?: string;
    keywords?: string;
    topicArea?: string;
    authors: Author[];
}

// Review types
export type ReviewStatus = 'Pending' | 'InProgress' | 'Completed' | 'Declined';
export type DecisionType = 'Approved' | 'Rejected' | 'RevisionRequired';

export interface ReviewCriteria {
    id: string;
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    descriptionAr?: string;
    maxScore: number;
    minScore: number;
    weight: number;
}

export interface ReviewScore {
    criteriaId: string;
    criteriaName?: string;
    score: number;
    comment?: string;
}

export interface Review {
    id: string;
    researchId: string;
    researchTitle?: string;
    status: ReviewStatus;
    assignedAt: string;
    dueDate?: string;
    startedAt?: string;
    completedAt?: string;
    overallScore?: number;
    recommendation?: DecisionType;
    commentsToAuthor?: string;
    commentsToChairman?: string;
    scores: ReviewScore[];
}

export interface ReviewSubmitRequest {
    scores: ReviewScore[];
    commentsToAuthor?: string;
    commentsToChairman?: string;
    recommendation: DecisionType;
}

// Decision types
export interface Decision {
    id: string;
    researchId: string;
    researchTitle?: string;
    decision: DecisionType;
    justification?: string;
    commentsToAuthor?: string;
    decidedAt: string;
    chairmanName?: string;
}

export interface DecisionCreateRequest {
    researchId: string;
    decision: DecisionType;
    justification?: string;
    commentsToAuthor?: string;
}

// Notification types
export interface Notification {
    id: string;
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
    isRead: boolean;
    link?: string;
    createdAt: string;
}

// Dashboard types
export interface ReviewerDashboard {
    pendingReviews: number;
    completedReviews: number;
    totalAssigned: number;
    upcomingReviews: Review[];
}

export interface ChairmanDashboard {
    pendingDecisions: number;
    approvedResearches: number;
    rejectedResearches: number;
    totalResearches: number;
    pendingResearches: Research[];
}

export interface AdminDashboard {
    totalConferences: number;
    activeConferences: number;
    totalResearches: number;
    pendingResearches: number;
    totalUsers: number;
    totalReviewers: number;
    unreadMessages: number;
    recentActivities: RecentActivity[];
}

export interface RecentActivity {
    action: string;
    entityType: string;
    createdAt: string;
    userName?: string;
}

// Contact types
export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'New' | 'Read' | 'Replied';
    createdAt: string;
    response?: string;
    respondedAt?: string;
}

export interface ContactCreateRequest {
    name: string;
    email: string;
    subject: string;
    message: string;
}

// Pagination
export interface PagedRequest {
    pageNumber: number;
    pageSize: number;
    search?: string;
    sortBy?: string;
    sortDescending?: boolean;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
}

// API Response
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}
