import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { ReviewerDashboard as ReviewerDashboardType } from '../../types';
import { handleApiError } from '../../utils/errorHandler';

export default function ReviewerDashboard() {
    const { t } = useTranslation();
    const [dashboard, setDashboard] = useState<ReviewerDashboardType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await dashboardApi.getReviewer();
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

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-6">
                {t('reviewer.title')}
            </h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/reviewer/pending" className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <ClipboardList className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 text-sm">{t('reviewer.pendingReviews')}</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboard?.pendingReviews || 0}</p>
                        </div>
                    </div>
                </Link>

                <Link to="/reviewer/completed" className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-green-600 dark:text-green-400 text-sm">{t('reviewer.completedReviews')}</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{dashboard?.completedReviews || 0}</p>
                        </div>
                    </div>
                </Link>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-purple-600 dark:text-purple-400 text-sm">{t('reviewer.assignedReviews')}</p>
                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{dashboard?.totalAssigned || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
