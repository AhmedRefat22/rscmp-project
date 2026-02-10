import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, FileText, MessageSquare, Activity, TrendingUp, Globe, Shield } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { AdminDashboard as AdminDashboardType } from '../../types';
import { handleApiError } from '../../utils/errorHandler';

export default function AdminDashboard() {
    const { t, i18n } = useTranslation();
    const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await dashboardApi.getAdmin();
                setDashboard(data);
            } catch (error) {
                handleApiError(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [t]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const stats = [
        { icon: Calendar, label: t('admin.conferences'), value: dashboard?.activeConferences || 0, total: dashboard?.totalConferences || 0, color: 'blue' },
        { icon: FileText, label: t('research.submissions'), value: dashboard?.pendingResearches || 0, total: dashboard?.totalResearches || 0, color: 'purple' },
        { icon: Users, label: t('admin.users'), value: dashboard?.totalReviewers || 0, total: dashboard?.totalUsers || 0, color: 'green' },
        { icon: MessageSquare, label: t('admin.messages'), value: dashboard?.unreadMessages || 0, total: 0, color: 'orange' },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-6">
                {t('admin.title')}
            </h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const colors: Record<string, string> = {
                        blue: 'from-blue-500 to-blue-600',
                        purple: 'from-purple-500 to-purple-600',
                        green: 'from-green-500 to-green-600',
                        orange: 'from-orange-500 to-orange-600',
                    };

                    const paths: Record<string, string> = {
                        blue: '/admin/conferences',
                        purple: '/admin/submissions',
                        green: '/admin/users',
                        orange: '/admin/messages',
                    };

                    const path = paths[stat.color] || '#';

                    return (
                        <Link to={path} key={index} className="card relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer block">
                            <div className={`absolute top-0 end-0 w-24 h-24 bg-gradient-to-br ${colors[stat.color]} rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                            <div className="relative">
                                <div className={`w-12 h-12 bg-gradient-to-br ${colors[stat.color]} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <p className="text-secondary-600 dark:text-secondary-400 text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{stat.label}</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-3xl font-bold text-secondary-800 dark:text-white">{stat.value}</span>
                                    {stat.total > 0 && (
                                        <span className="text-secondary-500">/ {stat.total}</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="card">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                        {i18n.language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/admin/users" className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-center">
                            <Users className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <span className="text-sm font-medium">{t('admin.users')}</span>
                        </Link>
                        <Link to="/admin/conferences" className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-center">
                            <Calendar className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <span className="text-sm font-medium">{t('admin.conferences')}</span>
                        </Link>
                        <Link to="/admin/messages" className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-center">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <span className="text-sm font-medium">{t('admin.messages')}</span>
                        </Link>
                        <Link to="/admin/settings" className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors text-center">
                            <Shield className="w-8 h-8 mx-auto mb-2 text-primary-600" />
                            <span className="text-sm font-medium">{t('admin.settings')}</span>
                        </Link>
                    </div>
                </div>

                {/* System Overview */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                        {i18n.language === 'ar' ? 'نظرة عامة على النظام' : 'System Overview'}
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-green-500" />
                                <span className="text-secondary-600 dark:text-secondary-400">
                                    {i18n.language === 'ar' ? 'حالة النظام' : 'System Status'}
                                </span>
                            </div>
                            <span className="badge badge-success">{i18n.language === 'ar' ? 'يعمل' : 'Online'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <span className="text-secondary-600 dark:text-secondary-400">
                                    {i18n.language === 'ar' ? 'المؤتمرات النشطة' : 'Active Conferences'}
                                </span>
                            </div>
                            <span className="font-medium text-secondary-800 dark:text-white">{dashboard?.activeConferences || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-500" />
                                <span className="text-secondary-600 dark:text-secondary-400">
                                    {i18n.language === 'ar' ? 'الأبحاث قيد المراجعة' : 'Research Under Review'}
                                </span>
                            </div>
                            <span className="font-medium text-secondary-800 dark:text-white">{dashboard?.pendingResearches || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                    {i18n.language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
                </h2>
                {dashboard?.recentActivities && dashboard.recentActivities.length > 0 ? (
                    <div className="space-y-3">
                        {dashboard.recentActivities.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-secondary-800 dark:text-white">
                                        {activity.action}
                                    </p>
                                    <p className="text-xs text-secondary-500">
                                        {activity.userName} • {new Date(activity.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-secondary-500 py-8">{t('common.noData')}</p>
                )}
            </div>
        </div>
    );
}
