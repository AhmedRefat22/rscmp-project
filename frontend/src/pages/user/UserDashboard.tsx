import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { FileText, Clock, CheckCircle, XCircle, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { researchApi } from '../../api/services';
import { useEffect, useState } from 'react';
import { Research } from '../../types';
import { handleApiError } from '../../utils/errorHandler';

export default function UserDashboard() {
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        total: 0,
        underReview: 0,
        accepted: 0,
        rejected: 0
    });
    const [recentSubmissions, setRecentSubmissions] = useState<Research[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const submissions = await researchApi.getMySubmissions();
                setRecentSubmissions(submissions.slice(0, 3)); // Get last 3
                setStats({
                    total: submissions.length,
                    underReview: submissions.filter(s => s.status === 'Submitted' || s.status === 'UnderReview').length,
                    accepted: submissions.filter(s => s.status === 'Approved').length,
                    rejected: submissions.filter(s => s.status === 'Rejected').length
                });
            } catch (error) {
                handleApiError(error);
            }
        };
        fetchStats();
    }, []);

    const getMotivationalMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('dashboard.goodMorning');
        if (hour < 18) return t('dashboard.goodAfternoon');
        return t('dashboard.goodEvening');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">
                            {getMotivationalMessage()}, {i18n.language === 'ar' ? user?.fullNameAr : user?.fullNameEn}!
                        </h1>
                        <p className="text-primary-100 text-lg opacity-90">
                            {t('dashboard.motivation', 'Your research contributes to the future. Keep pushing the boundaries of knowledge.')}
                        </p>
                    </div>
                    <Link to="/my-submissions/new" className="btn bg-white text-primary-700 hover:bg-primary-50 border-none shadow-md">
                        <Plus className="w-5 h-5 me-2" />
                        {t('research.newSubmission')}
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4 flex items-center gap-4 border-s-4 border-primary-500">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-600">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-secondary-500 text-sm">{t('dashboard.totalSubmissions', 'Total Submissions')}</p>
                        <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.total}</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-s-4 border-yellow-500">
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-full text-yellow-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-secondary-500 text-sm">{t('dashboard.underReview', 'Under Review')}</p>
                        <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.underReview}</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-s-4 border-green-500">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-secondary-500 text-sm">{t('dashboard.accepted', 'Accepted')}</p>
                        <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.accepted}</h3>
                    </div>
                </div>
                <div className="card p-4 flex items-center gap-4 border-s-4 border-red-500">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full text-red-600">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-secondary-500 text-sm">{t('dashboard.rejected', 'Rejected')}</p>
                        <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">{stats.rejected}</h3>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Submissions */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-secondary-800 dark:text-white">
                        {t('dashboard.recentActivity', 'Recent Submissions')}
                    </h2>
                    <Link to="/my-submissions/list" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                        {t('common.viewAll', 'View All')}
                        <ArrowRight className="w-4 h-4 ms-1" />
                    </Link>
                </div>

                {recentSubmissions.length > 0 ? (
                    <div className="space-y-4">
                        {recentSubmissions.map((research) => (
                            <div key={research.id} className="flex items-center justify-between p-4 bg-secondary-50 dark:bg-secondary-700/30 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                        ${research.status === 'Approved' ? 'bg-green-100 text-green-600' :
                                            research.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                                                'bg-blue-100 text-blue-600'}`}>
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-secondary-900 dark:text-white line-clamp-1">
                                            {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                                        </h4>
                                        <p className="text-xs text-secondary-500">
                                            {research.submittedAt ? new Date(research.submittedAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US') : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-end">
                                    <span className={`badge ${research.status === 'Draft' ? 'badge-gray' :
                                        research.status === 'Submitted' ? 'badge-primary' :
                                            research.status === 'UnderReview' ? 'badge-warning' :
                                                research.status === 'ReviewCompleted' ? 'badge-info' :
                                                    research.status === 'Approved' ? 'badge-success' :
                                                        'badge-danger'
                                        }`}>
                                        {research.status === 'Draft' ? t('status.draft') :
                                            research.status === 'Submitted' ? t('status.submitted') :
                                                research.status === 'UnderReview' ? t('status.underReview') :
                                                    research.status === 'ReviewCompleted' ? t('status.reviewCompleted') :
                                                        research.status === 'Approved' ? t('status.approved') :
                                                            research.status === 'Rejected' ? t('status.rejected') :
                                                                t('status.revisionRequired')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-secondary-500">
                        <p>{t('dashboard.noActivity', 'No recent submissions found.')}</p>
                        <Link to="/my-submissions/new" className="text-primary-600 hover:underline mt-2 inline-block">
                            {t('research.startNew', 'Start a new research')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
