import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { reviewsApi } from '../../api/services';
import { Review } from '../../types';
import toast from 'react-hot-toast';

export default function CompletedReviewsPage() {
    const { t } = useTranslation();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await reviewsApi.getCompleted();
                setReviews(data);
            } catch (error) {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
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
                {t('reviewer.completedReviews')}
            </h1>

            <div className="card">
                {reviews.length > 0 ? (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div key={review.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary-50 dark:bg-secondary-700/50">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-secondary-800 dark:text-white truncate">
                                        {review.researchTitle || 'Research Paper'}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-1 text-sm text-secondary-600 dark:text-secondary-400">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            {t('reviewer.completedDate')}: {review.completedAt ? new Date(review.completedAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <span className="badge badge-success">
                                            {review.status}
                                        </span>
                                        {review.overallScore !== undefined && (
                                            <span className="font-semibold">
                                                {t('reviewer.score')}: {review.overallScore}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Link to={`/reviewer/reviews/${review.id}`} className="btn-secondary ms-4">
                                    <FileText className="w-4 h-4 me-2" />
                                    {t('common.view')}
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-secondary-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">{t('common.noData')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
