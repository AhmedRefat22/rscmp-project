import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Edit, Star, Send, User } from 'lucide-react';
import { decisionsApi } from '../../api/services';
import { DecisionCreateRequest, DecisionType } from '../../types';

export default function DecisionPage() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch } = useForm<DecisionCreateRequest>({
        defaultValues: {
            decision: 'Approved',
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const result = await decisionsApi.getResearchForDecision(id);
                setData(result);
            } catch (error) {
                toast.error(t('errors.notFound'));
                navigate('/chairman');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, t]);

    const onSubmit = async (formData: DecisionCreateRequest) => {
        if (!id) return;
        setIsSubmitting(true);
        try {
            await decisionsApi.create({ ...formData, researchId: id });
            toast.success(t('common.success'));
            navigate('/chairman');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!data) return null;

    const { Research: research, Reviews: reviews, Summary: summary, ExistingDecision: existingDecision } = data;

    if (existingDecision) {
        return (
            <div className="animate-fade-in">
                <button onClick={() => navigate('/chairman')} className="btn-ghost mb-4">
                    <ArrowLeft className="w-4 h-4 me-2" />
                    {t('common.back')}
                </button>
                <div className="card text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h2 className="text-xl font-bold text-secondary-800 dark:text-white mb-2">
                        {i18n.language === 'ar' ? 'تم اتخاذ القرار' : 'Decision Already Made'}
                    </h2>
                    <p className="text-secondary-600 dark:text-secondary-400">
                        Decision: <span className="font-medium">{existingDecision.decision}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <button onClick={() => navigate('/chairman')} className="btn-ghost mb-4">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            {/* Research Info */}
            <div className="card mb-6">
                <h1 className="text-xl font-bold text-secondary-800 dark:text-white mb-2">
                    {i18n.language === 'ar' ? research.TitleAr : research.TitleEn}
                </h1>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">
                    {research.SubmissionNumber}
                </p>
                <p className="text-secondary-700 dark:text-secondary-300 text-sm">
                    {i18n.language === 'ar' ? research.AbstractAr : research.AbstractEn}
                </p>
            </div>

            {/* Review Summary */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                    {t('chairman.reviewSummary')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                        <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-secondary-800 dark:text-white">
                            {summary.AverageScore?.toFixed(1) || 'N/A'}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('chairman.averageScore')}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.ApproveRecommendations}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">{t('chairman.approve')}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                        <Edit className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.RevisionRecommendations}</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">{t('chairman.revisionRequired')}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <XCircle className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.RejectRecommendations}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{t('chairman.reject')}</p>
                    </div>
                </div>

                {/* Individual Reviews */}
                <h3 className="font-medium text-secondary-800 dark:text-white mb-3">{t('chairman.recommendations')}</h3>
                <div className="space-y-4">
                    {reviews.map((review: any) => (
                        <div key={review.Id} className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-secondary-400" />
                                    <span className="font-medium text-secondary-800 dark:text-white">{review.ReviewerName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-primary-600">{review.OverallScore}/100</span>
                                    <span className={`badge ${review.Recommendation === 'Approved' ? 'badge-success' :
                                        review.Recommendation === 'Rejected' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                        {review.Recommendation}
                                    </span>
                                </div>
                            </div>
                            {review.CommentsToChairman && (
                                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2">
                                    <span className="font-medium">{t('reviewer.commentsToChairman')}:</span> {review.CommentsToChairman}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Decision Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                    {t('chairman.makeDecision')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {(['Approved', 'RevisionRequired', 'Rejected'] as DecisionType[]).map((dec) => (
                        <label
                            key={dec}
                            className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 cursor-pointer transition-all ${watch('decision') === dec
                                ? dec === 'Approved' ? 'border-green-500 bg-green-50 dark:bg-green-900/30' :
                                    dec === 'Rejected' ? 'border-red-500 bg-red-50 dark:bg-red-900/30' :
                                        'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30'
                                : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
                                }`}
                        >
                            <input type="radio" {...register('decision')} value={dec} className="sr-only" />
                            {dec === 'Approved' ? <CheckCircle className="w-10 h-10 text-green-500" /> :
                                dec === 'Rejected' ? <XCircle className="w-10 h-10 text-red-500" /> :
                                    <Edit className="w-10 h-10 text-yellow-500" />}
                            <span className="font-medium text-secondary-800 dark:text-white">
                                {t(`chairman.${dec.toLowerCase().replace('required', 'Required')}`)}
                            </span>
                        </label>
                    ))}
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('chairman.justification')}</label>
                        <textarea {...register('justification')} className="input" rows={3} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('reviewer.commentsToAuthor')}</label>
                        <textarea {...register('commentsToAuthor')} className="input" rows={3} />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => navigate('/chairman')} className="btn-secondary">
                        {t('common.cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        <Send className="w-4 h-4 me-2" />
                        {isSubmitting ? t('common.loading') : t('common.confirm')}
                    </button>
                </div>
            </form>
        </div>
    );
}
