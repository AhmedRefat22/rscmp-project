import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, FileText, Star, Send, XCircle } from 'lucide-react';
import { reviewsApi, researchApi } from '../../api/services';
import { Review, ReviewSubmitRequest, DecisionType } from '../../types';

export default function ReviewPage() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [review, setReview] = useState<Review | null>(null);
    const [research, setResearch] = useState<any>(null);
    const [criteria, setCriteria] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, setValue, watch } = useForm<ReviewSubmitRequest>({
        defaultValues: {
            scores: [],
            recommendation: 'Approved',
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const reviewData = await reviewsApi.getById(id);
                setReview(reviewData);

                const researchData = await researchApi.getById(reviewData.researchId);
                setResearch(researchData);

                // Initialize scores
                if (researchData.conference?.reviewCriteria) {
                    setCriteria(researchData.conference.reviewCriteria);
                    const initialScores = researchData.conference.reviewCriteria.map((c: any) => ({
                        criteriaId: c.id,
                        score: 0,
                        comment: '',
                    }));
                    setValue('scores', initialScores);
                }
            } catch (error) {
                toast.error(t('errors.notFound'));
                navigate('/reviewer');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, setValue, t]);

    const handleStartReview = async () => {
        if (!id || review?.status !== 'Pending') return;
        try {
            const updated = await reviewsApi.start(id);
            setReview(updated);
            toast.success('Review started | بدأت المراجعة');
        } catch (error) {
            toast.error(t('errors.serverError'));
        }
    };

    const onSubmit = async (data: ReviewSubmitRequest) => {
        if (!id) return;
        setIsSubmitting(true);
        try {
            await reviewsApi.submit(id, data);
            toast.success(t('common.success'));
            navigate('/reviewer/completed');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!id || !confirm('Are you sure you want to decline this review? | هل أنت متأكد من رفض هذه المراجعة؟')) return;
        try {
            await reviewsApi.decline(id);
            toast.success('Review declined | تم رفض المراجعة');
            navigate('/reviewer');
        } catch (error) {
            toast.error(t('errors.serverError'));
        }
    };

    const downloadFile = async (fileId: string, fileName: string) => {
        if (!research) return;
        try {
            const blob = await researchApi.downloadFile(research.id, fileId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Download failed | فشل التحميل');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!review || !research) return null;

    const scores = watch('scores');

    return (
        <div className="animate-fade-in">
            <button onClick={() => navigate('/reviewer')} className="btn-ghost mb-4">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            {/* Research Info */}
            <div className="card mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-secondary-800 dark:text-white mb-2">
                            {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                        </h1>
                        <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">
                            {research.submissionNumber} • {research.conferenceName}
                        </p>
                    </div>
                    <span className={`badge ${review.status === 'Pending' ? 'badge-warning' :
                        review.status === 'InProgress' ? 'badge-primary' :
                            review.status === 'Completed' ? 'badge-success' : 'badge-danger'
                        }`}>
                        {review.status}
                    </span>
                </div>

                {/* Abstract */}
                <div className="mb-4">
                    <h3 className="font-medium text-secondary-800 dark:text-white mb-2">Abstract</h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                        {i18n.language === 'ar' ? research.abstractAr : research.abstractEn}
                    </p>
                </div>

                {/* Files */}
                <h3 className="font-medium text-secondary-800 dark:text-white mb-2">{t('research.uploadFile')}</h3>
                <div className="flex flex-wrap gap-2">
                    {research.files?.map((file: any) => (
                        <button
                            key={file.id}
                            onClick={() => downloadFile(file.id, file.originalFileName)}
                            className="flex items-center gap-2 px-3 py-2 bg-secondary-100 dark:bg-secondary-700 rounded-lg text-sm hover:bg-secondary-200 dark:hover:bg-secondary-600"
                        >
                            <FileText className="w-4 h-4" />
                            {file.originalFileName}
                            <Download className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Review Form */}
            {review.status !== 'Completed' && review.status !== 'Declined' && (
                <>
                    {review.status === 'Pending' ? (
                        <div className="card text-center py-8">
                            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                                {i18n.language === 'ar' ? 'يرجى البدء في المراجعة لتقييم هذا البحث' : 'Please start the review to evaluate this research'}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={handleStartReview} className="btn-primary">
                                    {t('reviewer.startReview')}
                                </button>
                                <button onClick={handleDecline} className="btn-danger">
                                    <XCircle className="w-4 h-4 me-2" />
                                    {t('reviewer.declineReview')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Scoring Criteria */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                                    {t('reviewer.criteria')}
                                </h2>
                                <div className="space-y-6">
                                    {criteria.map((criterion, index) => (
                                        <div key={criterion.id} className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium text-secondary-800 dark:text-white">
                                                        {i18n.language === 'ar' ? criterion.nameAr : criterion.nameEn}
                                                    </h4>
                                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                                                        {i18n.language === 'ar' ? criterion.descriptionAr : criterion.descriptionEn}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-secondary-500">
                                                    Max: {criterion.maxScore}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1">
                                                    {[...Array(criterion.maxScore)].map((_, i) => (
                                                        <button
                                                            key={i}
                                                            type="button"
                                                            onClick={() => {
                                                                const newScores = [...scores];
                                                                newScores[index] = { ...newScores[index], score: i + 1 };
                                                                setValue('scores', newScores);
                                                            }}
                                                            className={`w-8 h-8 rounded ${scores[index]?.score >= i + 1
                                                                ? 'bg-yellow-400 text-yellow-900'
                                                                : 'bg-secondary-200 dark:bg-secondary-600'
                                                                }`}
                                                        >
                                                            <Star className={`w-4 h-4 mx-auto ${scores[index]?.score >= i + 1 ? 'fill-current' : ''}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <span className="text-lg font-bold text-primary-600">
                                                    {scores[index]?.score || 0}/{criterion.maxScore}
                                                </span>
                                            </div>
                                            <textarea
                                                placeholder={i18n.language === 'ar' ? 'تعليق اختياري...' : 'Optional comment...'}
                                                className="input mt-3"
                                                rows={2}
                                                onChange={(e) => {
                                                    const newScores = [...scores];
                                                    newScores[index] = { ...newScores[index], comment: e.target.value };
                                                    setValue('scores', newScores);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                                    {t('reviewer.comments')}
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t('reviewer.commentsToAuthor')}</label>
                                        <textarea {...register('commentsToAuthor')} className="input" rows={4} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t('reviewer.commentsToChairman')}</label>
                                        <textarea {...register('commentsToChairman')} className="input" rows={4} />
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                                    {t('reviewer.recommendation')}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['Approved', 'RevisionRequired', 'Rejected'] as DecisionType[]).map((rec) => (
                                        <label
                                            key={rec}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${watch('recommendation') === rec
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                                                : 'border-secondary-200 dark:border-secondary-700'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                {...register('recommendation')}
                                                value={rec}
                                                className="w-4 h-4"
                                            />
                                            <span className="font-medium">
                                                {t(`chairman.${rec.toLowerCase().replace('required', 'Required')}`)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => navigate('/reviewer')} className="btn-secondary">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="btn-primary">
                                    <Send className="w-4 h-4 me-2" />
                                    {isSubmitting ? t('common.loading') : t('reviewer.submitReview')}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}
