import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, AlertCircle } from 'lucide-react';
import { researchApi } from '../../api/services';
import { Research, PagedResult } from '../../types';
import toast from 'react-hot-toast';

export default function ChairmanDecisionsPage() {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState<PagedResult<Research> | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get filters from URL
    const statusFilter = searchParams.get('status') || '';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Determine status to send to API
                // If status is 'All', send undefined/empty to get all
                // If status is specific (e.g., 'Pending', 'Approved'), send it
                // Note: 'Pending' for Chairman usually implies 'ReviewCompleted' status in backend for decisions, 
                // but the prompt implies filtering generic statuses. 
                // Let's assume the backend handles 'Pending' as 'ReviewCompleted' (needs decision) or 'Submitted'/'UnderReview'.
                // Ideally, we map UI status to backend status.
                // For this implementation, we pass the status string directly.

                const apiStatus = statusFilter === 'All' ? undefined : statusFilter;

                const result = await researchApi.getAll({
                    status: apiStatus,
                    page: 1,
                    pageSize: 50 // Fetch more for now
                });
                setData(result);
            } catch (error) {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [statusFilter, t]);

    const handleFilterChange = (newStatus: string) => {
        if (newStatus === 'All') {
            searchParams.delete('status');
        } else {
            searchParams.set('status', newStatus);
        }
        setSearchParams(searchParams);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                    {t('chairman.decisions')}
                </h1>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'ReviewCompleted', 'Approved', 'Rejected', 'RevisionRequired'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleFilterChange(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${(statusFilter === status || (status === 'All' && !statusFilter))
                                ? 'bg-primary-600 text-white'
                                : 'bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-600'
                                }`}
                        >
                            {status === 'All' ? t('common.all') : t(`research.status.${status.toLowerCase()}`)}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <div className="card">
                    {data?.items && data.items.length > 0 ? (
                        <div className="space-y-4">
                            {data.items.map((research) => (
                                <Link
                                    to={`/chairman/decisions/${research.id}`}
                                    key={research.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors block cursor-pointer"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary-200 dark:bg-secondary-600 text-secondary-700 dark:text-secondary-300">
                                                {research.submissionNumber}
                                            </span>
                                            <h3 className="font-medium text-secondary-800 dark:text-white truncate">
                                                {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-secondary-600 dark:text-secondary-400">
                                            <span className="flex items-center gap-1">
                                                <FileText className="w-4 h-4" />
                                                {research.authorName}
                                            </span>
                                            <span className={`badge ${research.status === 'Approved' ? 'badge-success' :
                                                research.status === 'Rejected' ? 'badge-danger' :
                                                    research.status === 'RevisionRequired' ? 'badge-warning' :
                                                        'badge-primary'
                                                }`}>
                                                {t(`research.status.${research.status.toLowerCase()}`)}
                                            </span>
                                            {research.conferenceName && (
                                                <span className="text-xs opacity-75">
                                                    {research.conferenceName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="btn-secondary ms-4 whitespace-nowrap">
                                        {t('common.view')}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-secondary-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-lg">{t('common.noData')}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
