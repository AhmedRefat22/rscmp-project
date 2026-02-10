import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, User, LogIn, UserPlus } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store/authStore';
import LanguageSwitcher from '../common/LanguageSwitcher';
import Logo from '../Logo';

export default function MainLayout() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout, selectedRole } = useAuthStore();
    const { isDarkMode, toggleDarkMode } = useUIStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const getDashboardLink = () => {
        switch (selectedRole) {
            case 'Admin': return '/admin';
            case 'Chairman': return '/chairman';
            case 'Reviewer': return '/reviewer';
            default: return '/my-submissions';
        }
    };

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-secondary-200 dark:border-secondary-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center">
                            <Logo size="md" showText={true} />
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/" className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors">
                                {t('nav.home')}
                            </Link>
                            <Link to="/research" className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors">
                                {t('nav.research')}
                            </Link>
                            <Link to="/contact" className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400 transition-colors">
                                {t('nav.contact')}
                            </Link>
                        </nav>

                        {/* Right Side */}
                        <div className="hidden md:flex items-center gap-4">
                            <LanguageSwitcher />

                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800 transition-colors"
                            >
                                {isDarkMode ? '☀️' : '🌙'}
                            </button>

                            {isAuthenticated ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={getDashboardLink()}
                                        className="btn-secondary text-sm"
                                    >
                                        {t('nav.dashboard')}
                                    </Link>
                                    <div className="relative group">
                                        <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-800">
                                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                                <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <span className="text-sm text-secondary-700 dark:text-secondary-300 max-w-[120px] truncate">
                                                {i18n.language === 'ar' ? user?.fullNameAr : user?.fullNameEn}
                                            </span>
                                        </button>
                                        <div className="absolute end-0 top-full mt-1 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg border border-secondary-200 dark:border-secondary-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                                            <Link to="/profile" className="block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700">
                                                {t('nav.profile')}
                                            </Link>
                                            <Link to="/my-submissions" className="block px-4 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700">
                                                {t('nav.mySubmissions')}
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                {t('nav.logout')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link to="/choose-role" className="btn-ghost text-sm">
                                        <LogIn className="w-4 h-4 me-1" />
                                        {t('nav.login')}
                                    </Link>
                                    <Link to="/register" className="btn-primary text-sm">
                                        <UserPlus className="w-4 h-4 me-1" />
                                        {t('nav.register')}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-secondary-600 dark:text-secondary-400"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-secondary-200 dark:border-secondary-700">
                            <nav className="flex flex-col gap-2">
                                <Link to="/" className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
                                    {t('nav.home')}
                                </Link>
                                <Link to="/research" className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
                                    {t('nav.research')}
                                </Link>
                                <Link to="/contact" className="px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg">
                                    {t('nav.contact')}
                                </Link>
                                <div className="flex items-center gap-4 px-4 py-2">
                                    <LanguageSwitcher />
                                    <button onClick={toggleDarkMode}>
                                        {isDarkMode ? '☀️' : '🌙'}
                                    </button>
                                </div>
                                {isAuthenticated ? (
                                    <>
                                        <Link to={getDashboardLink()} className="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
                                            {t('nav.dashboard')}
                                        </Link>
                                        <button onClick={handleLogout} className="px-4 py-2 text-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                            {t('nav.logout')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/choose-role" className="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
                                            {t('nav.login')}
                                        </Link>
                                        <Link to="/register" className="px-4 py-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
                                            {t('nav.register')}
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main>
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-secondary-800 dark:bg-secondary-950 text-secondary-400 py-12 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">R</span>
                                </div>
                                <span className="text-xl font-bold text-white">RSCMP</span>
                            </div>
                            <p className="text-sm text-secondary-500 max-w-sm">
                                {t('landing.about.description')}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">{t('nav.research')}</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link to="/research" className="hover:text-primary-400">{t('nav.research')}</Link></li>
                                <li><Link to="/contact" className="hover:text-primary-400">{t('nav.contact')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-white mb-4">{t('nav.about')}</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-primary-400">{t('footer.privacy')}</a></li>
                                <li><a href="#" className="hover:text-primary-400">{t('footer.terms')}</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-sm">
                        {t('footer.copyright')}
                    </div>
                </div>
            </footer>
        </div>
    );
}
