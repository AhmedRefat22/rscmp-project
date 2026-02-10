import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Menu,
    X,
    Home,
    FileText,
    Users,
    Bell,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    CheckCircle,
    Calendar,
    MessageSquare,
    FolderOpen,
} from 'lucide-react';
import { useAuthStore, useUIStore, useNotificationStore } from '../../store/authStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Logo from '../Logo';

interface DashboardLayoutProps {
    role: 'Admin' | 'Chairman' | 'Reviewer' | 'Public';
}

export default function DashboardLayout({ role }: DashboardLayoutProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { isSidebarOpen, toggleSidebar, isDarkMode, toggleDarkMode } = useUIStore();
    const { unreadCount } = useNotificationStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const menuItems = {
        Admin: [
            { icon: Home, label: t('admin.title'), path: '/admin' },
            { icon: Users, label: t('admin.users'), path: '/admin/users' },
            { icon: Calendar, label: t('admin.conferences'), path: '/admin/conferences' },
            { icon: FileText, label: t('admin.submissions'), path: '/admin/submissions' },
            { icon: MessageSquare, label: t('admin.messages'), path: '/admin/messages' },
        ],
        Chairman: [
            { icon: Home, label: t('dashboard.overview'), path: '/chairman' },
            { icon: CheckCircle, label: t('chairman.pendingDecisions'), path: '/chairman/decisions?status=ReviewCompleted' },
            { icon: FileText, label: t('chairman.decisions'), path: '/chairman/decisions' },
        ],
        Reviewer: [
            { icon: Home, label: t('reviewer.title'), path: '/reviewer' },
            { icon: ClipboardList, label: t('reviewer.pendingReviews'), path: '/reviewer/pending' },
            { icon: CheckCircle, label: t('reviewer.completedReviews'), path: '/reviewer/completed' },
        ],
        Public: [
            { icon: Home, label: t('dashboard.overview'), path: '/my-submissions' },
            { icon: FolderOpen, label: t('research.mySubmissions'), path: '/my-submissions/list' },
            { icon: FileText, label: t('research.newSubmission'), path: '/my-submissions/new' },
        ],
    };

    const currentMenuItems = menuItems[role];

    return (
        <div className="min-h-screen bg-secondary-100 dark:bg-secondary-900 flex">
            {/* Sidebar - Desktop */}
            <aside
                className={`hidden md:flex flex-col bg-white dark:bg-secondary-800 border-e border-secondary-200 dark:border-secondary-700 transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-700">
                    {isSidebarOpen && (
                        <Link to="/" className="flex items-center">
                            <Logo size="sm" showText={true} />
                        </Link>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 text-secondary-600 dark:text-secondary-400"
                    >
                        {isSidebarOpen ? (
                            i18n.language === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
                        ) : (
                            i18n.language === 'ar' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Menu */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    {currentMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                    : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {isSidebarOpen && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
                    {isSidebarOpen ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-secondary-800 dark:text-white truncate">
                                    {i18n.language === 'ar' ? user?.fullNameAr : user?.fullNameEn}
                                </p>
                                <p className="text-xs text-secondary-500 capitalize">{role}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between px-4 lg:px-6">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Breadcrumb / Title */}
                    <div className="hidden md:block">
                        <h1 className="text-lg font-semibold text-secondary-800 dark:text-white">
                            {t(`${role.toLowerCase()}.title`)}
                        </h1>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />

                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700"
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </button>

                        <Link
                            to="/notifications"
                            className="relative p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-700"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 end-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Link>

                        <div className="hidden md:flex items-center gap-2 ps-4 border-s border-secondary-200 dark:border-secondary-700">

                            <button onClick={handleLogout} className="btn-ghost text-sm text-red-600">
                                <LogOut className="w-4 h-4 me-1" />
                                {t('nav.logout')}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Mobile Sidebar */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
                        <div
                            className="absolute top-0 start-0 h-full w-64 bg-white dark:bg-secondary-800 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-700">
                                <Link to="/" className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold">R</span>
                                    </div>
                                    <span className="font-bold text-secondary-800 dark:text-white">RSCMP</span>
                                </Link>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="py-4">
                                {currentMenuItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700"
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <div className="absolute bottom-0 start-0 end-0 p-4 border-t border-secondary-200 dark:border-secondary-700">
                                <button onClick={handleLogout} className="w-full btn-danger">
                                    <LogOut className="w-4 h-4 me-2" />
                                    {t('nav.logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
