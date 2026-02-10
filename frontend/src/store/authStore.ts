import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    selectedRole: string | null;
    isAuthenticated: boolean;

    setUser: (user: User) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setSelectedRole: (role: string) => void;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            selectedRole: null,
            isAuthenticated: false,

            setUser: (user) => set({ user }),

            setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

            setSelectedRole: (role) => set({ selectedRole: role }),

            login: (user, accessToken, refreshToken) => set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
            }),

            logout: () => set({
                user: null,
                accessToken: null,
                refreshToken: null,
                selectedRole: null,
                isAuthenticated: false,
            }),

            updateUser: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null,
            })),
        }),
        {
            name: 'rscmp-auth',
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                selectedRole: state.selectedRole,
            }),
        }
    )
);

// UI State Store
interface UIState {
    isDarkMode: boolean;
    isSidebarOpen: boolean;
    toggleDarkMode: () => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isDarkMode: false,
            isSidebarOpen: true,

            toggleDarkMode: () => set((state) => {
                const newMode = !state.isDarkMode;
                if (newMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                return { isDarkMode: newMode };
            }),

            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

            setSidebarOpen: (open) => set({ isSidebarOpen: open }),
        }),
        {
            name: 'rscmp-ui',
            onRehydrateStorage: () => (state) => {
                if (state?.isDarkMode) {
                    document.documentElement.classList.add('dark');
                }
            },
        }
    )
);

// Notifications Store
interface NotificationState {
    unreadCount: number;
    setUnreadCount: (count: number) => void;
    decrementUnreadCount: () => void;
    clearUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    unreadCount: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
    decrementUnreadCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
    clearUnreadCount: () => set({ unreadCount: 0 }),
}));
