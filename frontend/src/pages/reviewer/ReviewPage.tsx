import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, FileText, Send, XCircle, CheckCircle, AlertTriangle, Ban } from 'lucide-react';
import { reviewsApi, researchApi } from '../../api/services';
import { Review, ReviewSubmitRequest, DecisionType } from '../../types';

export default function ReviewPage() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
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

                    let initialScores;
                    if (reviewData.scores && reviewData.scores.length > 0) {
                        initialScores = researchData.conference.reviewCriteria.map((c: any) => {
                            const existingScore = reviewData.scores.find((s: any) => s.criteriaId === c.id);
                            return {
                                criteriaId: c.id,
                                score: existingScore ? existingScore.score : 1,
                                comment: existingScore ? existingScore.comment : '',
                            };
                        });
                        setValue('commentsToAuthor', reviewData.commentsToAuthor || '');
                        setValue('commentsToChairman', reviewData.commentsToChairman || '');
                        setValue('recommendation', reviewData.recommendation || 'Approved');
                    } else {
                        initialScores = researchData.conference.reviewCriteria.map((c: any) => ({
                            criteriaId: c.id,
                            score: 1,
                            comment: '',
                        }));
                    }
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
            toast.success(isAr ? 'بدأت المراجعة' : 'Review started');
        } catch (error) {
            toast.error(t('errors.serverError'));
        }
    };

    const onSubmit = async (data: ReviewSubmitRequest) => {
        if (!id) return;
        // Validate all scores are between 1-10
        const invalidScore = data.scores.find((s: any) => s.score < 1 || s.score > 10);
        if (invalidScore) {
            toast.error(isAr ? 'جميع الدرجات يجب أن تكون بين 1 و 10' : 'All scores must be between 1 and 10');
            return;
        }
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
        if (!id || !confirm(isAr ? 'هل أنت متأكد من رفض هذه المراجعة؟' : 'Are you sure you want to decline this review?')) return;
        try {
            await reviewsApi.decline(id);
            toast.success(isAr ? 'تم رفض المراجعة' : 'Review declined');
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
            toast.error(isAr ? 'فشل التحميل' : 'Download failed');
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

    // Calculate average score
    const averageScore = scores && scores.length > 0
        ? (scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / scores.length).toFixed(2)
        : '0.00';

    const recommendationOptions: { value: DecisionType; labelAr: string; labelEn: string; icon: any; color: string }[] = [
        { value: 'Approved', labelAr: 'قبول', labelEn: 'Accept', icon: CheckCircle, color: 'green' },
        { value: 'RevisionRequired', labelAr: 'مطلوب تعديل', labelEn: 'Revision Required', icon: AlertTriangle, color: 'yellow' },
        { value: 'Rejected', labelAr: 'مرفوض', labelEn: 'Rejected', icon: Ban, color: 'red' },
    ];

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
                            {isAr ? research.titleAr : research.titleEn}
                        </h1>
                        <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">
                            {research.submissionNumber} • {research.conferenceName}
                        </p>
                    </div>
                    <span className={`badge ${review.status === 'Pending' ? 'badge-warning' :
                        review.status === 'InProgress' ? 'badge-primary' :
                            review.status === 'Completed' ? 'badge-success' :
                                review.status === 'Returned' ? 'badge-danger' : 'badge-danger'
                        }`}>
                        {review.status}
                    </span>
                </div>

                {/* Abstract */}
                <div className="mb-4">
                    <h3 className="font-medium text-secondary-800 dark:text-white mb-2">
                        {isAr ? 'الملخص' : 'Abstract'}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                        {isAr ? research.abstractAr : research.abstractEn}
                    </p>
                </div>

                {/* Files - PDF Download */}
                <div>
                    <h3 className="font-medium text-secondary-800 dark:text-white mb-3">
                        {isAr ? 'ملفات البحث' : 'Research Files'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {research.files?.length > 0 ? (
                            research.files.map((file: any) => (
                                <button
                                    key={file.id}
                                    onClick={() => downloadFile(file.id, file.originalFileName)}
                                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-xl text-sm hover:shadow-md transition-all"
                                >
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-blue-700 dark:text-blue-300">{file.originalFileName}</span>
                                    <Download className="w-5 h-5 text-blue-500" />
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-secondary-500">{isAr ? 'لا توجد ملفات' : 'No files uploaded'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Chairman Feedback - Only if Returned */}
            {review.status === 'Returned' && (
                <div className="bg-red-50 border-s-4 border-red-500 p-4 mb-6 dark:bg-red-900/20 dark:border-red-600 rounded-lg">
                    <div className="flex">
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div className="ms-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                {isAr ? 'تم إعادة المراجعة من رئيس اللجنة' : 'Review Returned by Chairman'}
                            </h3>
                            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                <p>{review.chairmanFeedback}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Form */}
            {((review.status !== 'Completed' && review.status !== 'Declined') || review.status === 'Returned') && (
                <>
                    {review.status === 'Pending' ? (
                        <div className="card text-center py-8">
                            <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                                {isAr ? 'يرجى البدء في المراجعة لتقييم هذا البحث' : 'Please start the review to evaluate this research'}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={handleStartReview} className="btn-primary">
                                    {isAr ? 'ابدأ المراجعة' : 'Start Review'}
                                </button>
                                <button onClick={handleDecline} className="btn-danger">
                                    <XCircle className="w-4 h-4 me-2" />
                                    {isAr ? 'رفض المراجعة' : 'Decline Review'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Scoring Criteria */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-2">
                                    {isAr ? 'معايير التقييم' : 'Evaluation Criteria'}
                                </h2>
                                <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-6">
                                    {isAr ? 'قيّم البحث في كل معيار من 1 إلى 10' : 'Rate the research from 1 to 10 for each criterion'}
                                </p>

                                <div className="space-y-5">
                                    {criteria.map((criterion, index) => (
                                        <div key={criterion.id} className="p-5 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl border border-secondary-200 dark:border-secondary-600">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-secondary-800 dark:text-white text-base">
                                                        {isAr ? criterion.nameAr : criterion.nameEn}
                                                    </h4>
                                                    <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                                                        {isAr ? criterion.descriptionAr : criterion.descriptionEn}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Score Slider with Number Input */}
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-secondary-400 w-4">1</span>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={scores[index]?.score || 1}
                                                    onChange={(e) => {
                                                        const newScores = [...scores];
                                                        newScores[index] = { ...newScores[index], score: parseInt(e.target.value) };
                                                        setValue('scores', newScores);
                                                    }}
                                                    className="flex-1 h-2 bg-secondary-200 dark:bg-secondary-600 rounded-lg appearance-none cursor-pointer accent-primary-500"
                                                />
                                                <span className="text-xs text-secondary-400 w-6">10</span>
                                                <div className="w-16 h-12 flex items-center justify-center bg-primary-100 dark:bg-primary-900/40 rounded-xl border-2 border-primary-300 dark:border-primary-600">
                                                    <span className="text-xl font-bold text-primary-700 dark:text-primary-300">
                                                        {scores[index]?.score || 1}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Average Score */}
                                <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-xl border border-primary-200 dark:border-primary-700">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-primary-800 dark:text-primary-200">
                                            {isAr ? 'المتوسط الحسابي' : 'Average Score'}
                                        </span>
                                        <span className="text-3xl font-bold text-primary-600 dark:text-primary-300">
                                            {averageScore} <span className="text-lg text-primary-400">/ 10</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                                    {isAr ? 'التعليقات' : 'Comments'}
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            {isAr ? 'تعليقات للمؤلف' : 'Comments to Author'}
                                        </label>
                                        <textarea {...register('commentsToAuthor')} className="input" rows={4}
                                            placeholder={isAr ? 'اكتب ملاحظاتك للمؤلف...' : 'Write your feedback for the author...'} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">
                                            {isAr ? 'تعليقات سرية لرئيس اللجنة' : 'Confidential Comments to Chairman'}
                                        </label>
                                        <textarea {...register('commentsToChairman')} className="input" rows={4}
                                            placeholder={isAr ? 'اكتب ملاحظاتك السرية لرئيس اللجنة...' : 'Write confidential notes for the chairman...'} />
                                    </div>
                                </div>
                            </div>

                            {/* Recommendation to Chairman */}
                            <div className="card">
                                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                                    {isAr ? 'التوصية إلى رئيس اللجنة' : 'Recommendation to Chairman'}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {recommendationOptions.map((rec) => {
                                        const Icon = rec.icon;
                                        const isSelected = watch('recommendation') === rec.value;
                                        return (
                                            <label
                                                key={rec.value}
                                                className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                    ? rec.color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg shadow-green-100 dark:shadow-none' :
                                                        rec.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 shadow-lg shadow-yellow-100 dark:shadow-none' :
                                                            'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-lg shadow-red-100 dark:shadow-none'
                                                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    {...register('recommendation')}
                                                    value={rec.value}
                                                    className="sr-only"
                                                />
                                                <Icon className={`w-10 h-10 ${rec.color === 'green' ? 'text-green-500' :
                                                    rec.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                                                    }`} />
                                                <span className="font-semibold text-secondary-800 dark:text-white">
                                                    {isAr ? rec.labelAr : rec.labelEn}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={() => navigate('/reviewer')} className="btn-secondary">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={isSubmitting} className="btn-primary">
                                    <Send className="w-4 h-4 me-2" />
                                    {isSubmitting
                                        ? (isAr ? 'جاري الإرسال...' : 'Submitting...')
                                        : (isAr ? 'إرسال التقييم' : 'Submit Review')}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
}
