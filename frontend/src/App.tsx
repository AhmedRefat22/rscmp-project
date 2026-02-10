import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from './store/authStore';
import { authApi, notificationsApi } from './api/services';
import { useNotificationStore } from './store/authStore';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import RoleLoginSelector from './pages/auth/RoleLoginSelector';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import PublicResearchPage from './pages/public/PublicResearchPage';
import PublicResearchDetail from './pages/public/PublicResearchDetail';
import ContactPage from './pages/ContactPage';

// ... (existing code)

{/* Public Routes with Main Layout */ }
<Route element={<MainLayout />}>
    <Route path="/" element={<LandingPage />} />
    <Route path="/choose-role" element={<RoleLoginSelector />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/research" element={<PublicResearchPage />} />
    <Route path="/research/:id" element={<PublicResearchDetail />} />
    <Route path="/contact" element={<ContactPage />} />
</Route>

// Reviewer Pages
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import PendingReviewsPage from './pages/reviewer/PendingReviewsPage';
import CompletedReviewsPage from './pages/reviewer/CompletedReviewsPage';
import ReviewPage from './pages/reviewer/ReviewPage';
// Chairman Pages
import ChairmanDashboard from './pages/chairman/ChairmanDashboard';
import ChairmanDecisionsPage from './pages/chairman/ChairmanDecisionsPage';
import DecisionPage from './pages/chairman/DecisionPage';
// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import UserDetail from './pages/admin/UserDetail';
import ConferencesPage from './pages/admin/ConferencesPage';
import AddConferencePage from './pages/admin/AddConferencePage';
import ConferenceDetail from './pages/admin/ConferenceDetail';
import SettingsPage from './pages/admin/SettingsPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';

// User Pages
import MySubmissions from './pages/user/MySubmissions';
import UserDashboard from './pages/user/UserDashboard';
import NewSubmission from './pages/user/NewSubmission';
import SubmissionDetail from './pages/user/SubmissionDetail';
import ProfilePage from './pages/user/ProfilePage';
import NotificationsPage from './pages/user/NotificationsPage';

// Protected Route Component
const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
    const { isAuthenticated, user, selectedRole } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0) {
        const hasRole = roles.some((role) => user?.roles.includes(role) || selectedRole === role);
        if (!hasRole) {
            return <Navigate to="/" replace />;
        }
    }

    return <>{children}</>;
};

// Role Route - requires role selection
const RoleRoute = ({ children, role }: { children: React.ReactNode; role: string }) => {
    const { isAuthenticated, selectedRole } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (selectedRole !== role) {
        return <Navigate to="/select-role" replace />;
    }

    return <>{children}</>;
};

function App() {
    useTranslation();
    const { isAuthenticated, accessToken, setUser } = useAuthStore();
    const { isDarkMode } = useUIStore();
    const { setUnreadCount } = useNotificationStore();

    // Fetch user on mount if authenticated
    useEffect(() => {
        const fetchUser = async () => {
            if (accessToken && isAuthenticated) {
                try {
                    const user = await authApi.getCurrentUser();
                    setUser(user);

                    // Fetch notification count
                    const count = await notificationsApi.getUnreadCount();
                    setUnreadCount(count);
                } catch {
                    // Token expired or invalid
                }
            }
        };
        fetchUser();
    }, [accessToken, isAuthenticated, setUser, setUnreadCount]);

    // Apply dark mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <Routes>
            {/* Public Routes with Main Layout */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/choose-role" element={<RoleLoginSelector />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/research" element={<PublicResearchPage />} />
                <Route path="/contact" element={<ContactPage />} />
            </Route>

            {/* Role Selection */}
            <Route
                path="/select-role"
                element={
                    <ProtectedRoute>
                        <RoleSelectionPage />
                    </ProtectedRoute>
                }
            />

            {/* Reviewer Dashboard */}
            <Route
                path="/reviewer"
                element={
                    <RoleRoute role="Reviewer">
                        <DashboardLayout role="Reviewer" />
                    </RoleRoute>
                }
            >
                <Route index element={<ReviewerDashboard />} />
                <Route path="pending" element={<PendingReviewsPage />} />
                <Route path="completed" element={<CompletedReviewsPage />} />
                <Route path="reviews/:id" element={<ReviewPage />} />
            </Route>

            {/* Chairman Dashboard */}
            <Route
                path="/chairman"
                element={
                    <RoleRoute role="Chairman">
                        <DashboardLayout role="Chairman" />
                    </RoleRoute>
                }
            >
                <Route index element={<ChairmanDashboard />} />
                <Route path="decisions" element={<ChairmanDecisionsPage />} />
                <Route path="decisions/:id" element={<DecisionPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route
                path="/admin"
                element={
                    <RoleRoute role="Admin">
                        <DashboardLayout role="Admin" />
                    </RoleRoute>
                }
            >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="users/:id" element={<UserDetail />} />
                <Route path="conferences" element={<ConferencesPage />} />
                <Route path="conferences/new" element={<AddConferencePage />} />
                <Route path="conferences/:id" element={<ConferenceDetail />} />
                <Route path="submissions" element={<AdminSubmissionsPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* User Routes */}
            <Route
                path="/my-submissions"
                element={
                    <ProtectedRoute>
                        <DashboardLayout role="Public" />
                    </ProtectedRoute>
                }
            >
                <Route index element={<UserDashboard />} />
                <Route path="list" element={<MySubmissions />} />
                <Route path="new" element={<NewSubmission />} />
                <Route path=":id" element={<SubmissionDetail />} />
            </Route>

            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/notifications"
                element={
                    <ProtectedRoute>
                        <NotificationsPage />
                    </ProtectedRoute>
                }
            />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
