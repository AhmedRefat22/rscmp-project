import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, CheckCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import { dashboardApi, reviewsApi } from '../../api/services';
import { ReviewerDashboard as ReviewerDashboardType, Research } from '../../types';
import { handleApiError } from '../../utils/errorHandler';
import toast from 'react-hot-toast';

export default function ReviewerDashboard() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<ReviewerDashboardType | null>(null);
    const [availablePapers, setAvailablePapers] = useState<Research[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [assigningId, setAssigningId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashData, papers] = await Promise.all([
                    dashboardApi.getReviewer(),
                    reviewsApi.getAvailable(),
                ]);
                setDashboard(dashData);
                setAvailablePapers(papers);
            } catch (error) {
                handleApiError(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [t]);

    const handleSelfAssign = async (researchId: string) => {
        setAssigningId(researchId);
        try {
            const review = await reviewsApi.selfAssign(researchId);
            toast.success(i18n.language === 'ar' ? 'تم تعيين البحث بنجاح' : 'Research assigned successfully');
            // Navigate to the review page
            navigate(`/reviewer/reviews/${review.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setAssigningId(null);
        }
    };

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

            {/* Available Papers for Review */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-secondary-800 dark:text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary-500" />
                    {i18n.language === 'ar' ? 'الأبحاث المتاحة للتقييم' : 'Papers Available for Review'}
                </h2>

                {availablePapers.length > 0 ? (
                    <div className="grid gap-4">
                        {availablePapers.map((paper) => (
                            <div
                                key={paper.id}
                                className="card hover:shadow-lg transition-shadow border-s-4 border-primary-500"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-secondary-800 dark:text-white mb-1">
                                            {i18n.language === 'ar' ? paper.titleAr : paper.titleEn}
                                        </h3>
                                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2 line-clamp-2">
                                            {i18n.language === 'ar' ? paper.abstractAr : paper.abstractEn}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-secondary-500">
                                            <span>{paper.conferenceName}</span>
                                            {paper.submissionNumber && <span>• {paper.submissionNumber}</span>}
                                            {paper.submittedAt && (
                                                <span>• {new Date(paper.submittedAt).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelfAssign(paper.id)}
                                        disabled={assigningId === paper.id}
                                        className="btn-primary flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {assigningId === paper.id ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <ArrowRight className="w-4 h-4" />
                                        )}
                                        {assigningId === paper.id
                                            ? (i18n.language === 'ar' ? 'جاري...' : 'Assigning...')
                                            : (i18n.language === 'ar' ? 'ابدأ التقييم' : 'Start Review')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <FileText className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-3" />
                        <p className="text-secondary-500 dark:text-secondary-400">
                            {i18n.language === 'ar' ? 'لا توجد أبحاث متاحة للتقييم حالياً' : 'No papers available for review at the moment'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
