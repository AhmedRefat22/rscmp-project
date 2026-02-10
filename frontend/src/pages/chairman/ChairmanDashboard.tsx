import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import { ChairmanDashboard as ChairmanDashboardType } from '../../types';
import { handleApiError } from '../../utils/errorHandler';

export default function ChairmanDashboard() {
    const { t, i18n } = useTranslation();
    const [dashboard, setDashboard] = useState<ChairmanDashboardType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await dashboardApi.getChairman();
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
                {t('chairman.title')}
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Link to="/chairman/decisions?status=ReviewCompleted" className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow cursor-pointer block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm">{t('chairman.pendingDecisions')}</p>
                            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{dashboard?.pendingDecisions || 0}</p>
                        </div>
                    </div>
                </Link>

                <Link to="/chairman/decisions?status=Approved" className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow cursor-pointer block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-green-600 dark:text-green-400 text-sm">{t('dashboard.stats.approved')}</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{dashboard?.approvedResearches || 0}</p>
                        </div>
                    </div>
                </Link>

                <Link to="/chairman/decisions?status=Rejected" className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow cursor-pointer block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                            <XCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-red-600 dark:text-red-400 text-sm">{t('dashboard.stats.rejected')}</p>
                            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{dashboard?.rejectedResearches || 0}</p>
                        </div>
                    </div>
                </Link>

                <Link to="/chairman/decisions?status=All" className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer block">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 text-sm">{i18n.language === 'ar' ? 'إجمالي الأبحاث' : 'Total Research'}</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{dashboard?.totalResearches || 0}</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
