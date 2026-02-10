import api from './client';
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    User,
    Conference,
    Research,
    ResearchCreateRequest,
    Review,
    ReviewSubmitRequest,
    Decision,
    DecisionCreateRequest,
    Notification,
    ContactCreateRequest,
    ReviewerDashboard,
    ChairmanDashboard,
    AdminDashboard,
    PagedResult,
    CreateUserByAdminRequest,
} from '../types';

// Auth API
export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    refresh: async (accessToken: string, refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post('/auth/refresh', { accessToken, refreshToken });
        return response.data;
    },

    logout: async (): Promise<void> => {
        await api.post('/auth/logout');
    },

    getCurrentUser: async (): Promise<User> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    getRoles: async (): Promise<string[]> => {
        const response = await api.get('/auth/roles');
        return response.data;
    },

    selectRole: async (role: string): Promise<void> => {
        await api.post('/auth/select-role', { role });
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.post('/auth/change-password', { currentPassword, newPassword });
    },

    forgotPassword: async (email: string): Promise<void> => {
        await api.post('/auth/forgot-password', { email });
    },

    resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
        await api.post('/auth/reset-password', { email, code, newPassword });
    },
};

// Conferences API
export const conferencesApi = {
    getAll: async (activeOnly = false): Promise<Conference[]> => {
        const response = await api.get('/conferences', { params: { activeOnly } });
        return response.data;
    },

    getById: async (id: string): Promise<Conference> => {
        const response = await api.get(`/conferences/${id}`);
        return response.data;
    },

    create: async (data: Partial<Conference> | FormData): Promise<Conference> => {
        const response = await api.post('/conferences', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    update: async (id: string, data: Partial<Conference>): Promise<Conference> => {
        const response = await api.put(`/conferences/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/conferences/${id}`);
    },

    getStatistics: async (id: string): Promise<any> => {
        const response = await api.get(`/conferences/${id}/statistics`);
        return response.data;
    },
};

// Research API
export const researchApi = {
    getAll: async (params?: { conferenceId?: string; status?: string; page?: number; pageSize?: number }): Promise<PagedResult<Research>> => {
        const response = await api.get('/research', { params });
        return response.data;
    },

    getMySubmissions: async (): Promise<Research[]> => {
        const response = await api.get('/research/my-submissions');
        return response.data;
    },

    getById: async (id: string): Promise<Research> => {
        const response = await api.get(`/research/${id}`);
        return response.data;
    },

    create: async (data: ResearchCreateRequest): Promise<Research> => {
        const response = await api.post('/research', data);
        return response.data;
    },

    update: async (id: string, data: Partial<ResearchCreateRequest>): Promise<Research> => {
        const response = await api.put(`/research/${id}`, data);
        return response.data;
    },

    submit: async (id: string): Promise<Research> => {
        const response = await api.post(`/research/${id}/submit`);
        return response.data;
    },

    uploadFile: async (id: string, file: File, fileType = 'MainDocument'): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/research/${id}/files?fileType=${fileType}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    downloadFile: async (researchId: string, fileId: string): Promise<Blob> => {
        const response = await api.get(`/research/${researchId}/files/${fileId}`, {
            responseType: 'blob',
        });
        return response.data;
    },

    getPublic: async (conferenceId?: string): Promise<Research[]> => {
        const response = await api.get('/research/public', { params: { conferenceId } });
        return response.data;
    },
};

// Reviews API
export const reviewsApi = {
    getPending: async (): Promise<Review[]> => {
        const response = await api.get('/reviews/pending');
        return response.data;
    },

    getCompleted: async (): Promise<Review[]> => {
        const response = await api.get('/reviews/completed');
        return response.data;
    },

    getById: async (id: string): Promise<Review> => {
        const response = await api.get(`/reviews/${id}`);
        return response.data;
    },

    getByResearch: async (researchId: string): Promise<Review[]> => {
        const response = await api.get(`/reviews/research/${researchId}`);
        return response.data;
    },

    assign: async (researchId: string, reviewerId: string, dueDate?: string): Promise<Review> => {
        const response = await api.post('/reviews/assign', { researchId, reviewerId, dueDate });
        return response.data;
    },

    start: async (id: string): Promise<Review> => {
        const response = await api.post(`/reviews/${id}/start`);
        return response.data;
    },

    submit: async (id: string, data: ReviewSubmitRequest): Promise<Review> => {
        const response = await api.post(`/reviews/${id}/submit`, data);
        return response.data;
    },

    decline: async (id: string, reason?: string): Promise<void> => {
        await api.post(`/reviews/${id}/decline`, reason);
    },
};

// Decisions API
export const decisionsApi = {
    getPending: async (): Promise<Research[]> => {
        const response = await api.get('/decisions/pending');
        return response.data;
    },

    getResearchForDecision: async (researchId: string): Promise<any> => {
        const response = await api.get(`/decisions/research/${researchId}`);
        return response.data;
    },

    create: async (data: DecisionCreateRequest): Promise<Decision> => {
        const response = await api.post('/decisions', data);
        return response.data;
    },

    getById: async (id: string): Promise<Decision> => {
        const response = await api.get(`/decisions/${id}`);
        return response.data;
    },

    getMyDecisions: async (): Promise<Decision[]> => {
        const response = await api.get('/decisions/my-decisions');
        return response.data;
    },
};

// Notifications API
export const notificationsApi = {
    getAll: async (unreadOnly = false): Promise<Notification[]> => {
        const response = await api.get('/notifications', { params: { unreadOnly } });
        return response.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
        await api.post(`/notifications/${id}/read`);
    },

    markAllAsRead: async (): Promise<void> => {
        await api.post('/notifications/read-all');
    },
};

// Contact API
export const contactApi = {
    submit: async (data: ContactCreateRequest): Promise<void> => {
        await api.post('/contact', data);
    },
};

// Dashboard API
export const dashboardApi = {
    getReviewer: async (): Promise<ReviewerDashboard> => {
        const response = await api.get('/dashboard/reviewer');
        return response.data;
    },

    getChairman: async (): Promise<ChairmanDashboard> => {
        const response = await api.get('/dashboard/chairman');
        return response.data;
    },

    getAdmin: async (): Promise<AdminDashboard> => {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },
};

// Admin API
export const adminApi = {
    getUsers: async (params?: { page?: number; pageSize?: number; role?: string }): Promise<PagedResult<User>> => {
        const response = await api.get('/admin/users', { params });
        return response.data;
    },

    getUser: async (id: string): Promise<User> => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    },

    createUser: async (data: CreateUserByAdminRequest): Promise<User> => {
        const response = await api.post('/admin/users', data);
        return response.data;
    },

    assignRole: async (userId: string, role: string): Promise<void> => {
        await api.post(`/admin/users/${userId}/roles`, role);
    },

    removeRole: async (userId: string, role: string): Promise<void> => {
        await api.delete(`/admin/users/${userId}/roles/${role}`);
    },

    deleteUser: async (id: string): Promise<void> => {
        await api.delete(`/admin/users/${id}`);
    },

    getSettings: async (category?: string): Promise<any[]> => {
        const response = await api.get('/admin/settings', { params: { category } });
        return response.data;
    },

    updateSetting: async (key: string, value: string): Promise<any> => {
        const response = await api.put(`/admin/settings/${key}`, value);
        return response.data;
    },

    getAuditLogs: async (params?: { page?: number; pageSize?: number; action?: string; entityType?: string }): Promise<PagedResult<any>> => {
        const response = await api.get('/admin/audit-logs', { params });
        return response.data;
    },

    getContactMessages: async (params?: { page?: number; pageSize?: number; status?: string }): Promise<PagedResult<any>> => {
        const response = await api.get('/admin/contact-messages', { params });
        return response.data;
    },

    replyToMessage: async (id: string, response: string): Promise<any> => {
        const res = await api.post(`/admin/contact-messages/${id}/reply`, response);
        return res.data;
    },
};
