import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, XCircle, Edit, Star, Send, User, Download, FileText, AlertTriangle, Ban } from 'lucide-react';
import { reviewsApi, decisionsApi, researchApi } from '../../api/services';
import { DecisionCreateRequest, DecisionType } from '../../types';

export default function DecisionPage() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const isAr = i18n.language === 'ar';
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [researchFiles, setResearchFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch } = useForm<DecisionCreateRequest>({
        defaultValues: {
            decision: 'Approved',
        },
    });

    const [returningId, setReturningId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const result = await decisionsApi.getResearchForDecision(id);
                setData(result);

                // Load files
                try {
                    const researchData = await researchApi.getById(id);
                    if (researchData?.files) {
                        setResearchFiles(researchData.files);
                    }
                } catch { }
            } catch (error) {
                toast.error(t('errors.notFound'));
                navigate('/chairman');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, t]);

    const handleApproveReview = async (reviewId: string) => {
        if (!confirm(isAr ? 'هل أنت متأكد من اعتماد هذه المراجعة؟' : 'Are you sure you want to approve this review?')) return;
        try {
            await reviewsApi.approve(reviewId);
            toast.success(t('common.success'));
            const result = await decisionsApi.getResearchForDecision(id!);
            setData(result);
        } catch (error) {
            toast.error(t('errors.serverError'));
        }
    };

    const handleReturnReview = async (reviewId: string) => {
        if (!feedback.trim()) return;
        try {
            await reviewsApi.return(reviewId, feedback);
            toast.success(t('common.success'));
            setReturningId(null);
            setFeedback('');
            const result = await decisionsApi.getResearchForDecision(id!);
            setData(result);
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        }
    };

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

    const downloadFile = async (fileId: string, fileName: string) => {
        if (!id) return;
        try {
            const blob = await researchApi.downloadFile(id, fileId);
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

    const getRecommendationLabel = (rec: string) => {
        if (rec === 'Approved') return isAr ? 'قبول' : 'Accept';
        if (rec === 'RevisionRequired') return isAr ? 'مطلوب تعديل' : 'Revision Required';
        if (rec === 'Rejected') return isAr ? 'مرفوض' : 'Rejected';
        return rec;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!data) return null;

    const { research, reviews, summary, existingDecision } = data;

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
                        {isAr ? 'تم اتخاذ القرار' : 'Decision Already Made'}
                    </h2>
                    <p className="text-secondary-600 dark:text-secondary-400">
                        {isAr ? 'القرار' : 'Decision'}: <span className="font-medium">{getRecommendationLabel(existingDecision.decision)}</span>
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
                    {isAr ? research.titleAr : research.titleEn}
                </h1>
                <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">
                    {research.submissionNumber} {research.conferenceName && `• ${research.conferenceName}`}
                </p>
                <p className="text-secondary-700 dark:text-secondary-300 text-sm mb-4">
                    {isAr ? research.abstractAr : research.abstractEn}
                </p>

                {/* Files - PDF Download */}
                {researchFiles.length > 0 && (
                    <div>
                        <h3 className="font-medium text-secondary-800 dark:text-white mb-3">
                            {isAr ? 'ملفات البحث' : 'Research Files'}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {researchFiles.map((file: any) => (
                                <button
                                    key={file.id}
                                    onClick={() => downloadFile(file.id, file.originalFileName)}
                                    className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-xl text-sm hover:shadow-md transition-all"
                                >
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-blue-700 dark:text-blue-300">{file.originalFileName}</span>
                                    <Download className="w-5 h-5 text-blue-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Review Summary */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                    {isAr ? 'ملخص المراجعات' : 'Review Summary'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                        <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-secondary-800 dark:text-white">
                            {summary.averageScore?.toFixed(1) || 'N/A'}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{isAr ? 'متوسط الدرجات' : 'Average Score'}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.approveRecommendations}</p>
                        <p className="text-sm text-green-600 dark:text-green-400">{isAr ? 'قبول' : 'Accept'}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                        <Edit className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.revisionRecommendations}</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">{isAr ? 'مطلوب تعديل' : 'Revision Required'}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <XCircle className="w-6 h-6 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.rejectRecommendations}</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{isAr ? 'مرفوض' : 'Rejected'}</p>
                    </div>
                </div>

                {/* Individual Reviews */}
                <h3 className="font-medium text-secondary-800 dark:text-white mb-3">
                    {isAr ? 'تقييمات المراجعين' : 'Reviewer Evaluations'}
                </h3>
                <div className="space-y-4">
                    {reviews?.map((review: any) => (
                        <div key={review.id} className="p-5 bg-secondary-50 dark:bg-secondary-700/50 rounded-xl border border-secondary-200 dark:border-secondary-600">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <User className="w-5 h-5 text-secondary-400" />
                                    <span className="font-medium text-secondary-800 dark:text-white">{review.reviewerName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-primary-600">{review.overallScore?.toFixed(1) || 'N/A'}</span>
                                    <span className={`badge ${review.recommendation === 'Approved' ? 'badge-success' :
                                        review.recommendation === 'Rejected' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                        {getRecommendationLabel(review.recommendation)}
                                    </span>
                                </div>
                            </div>

                            {/* Reviewer Criteria Scores */}
                            {review.scores && review.scores.length > 0 && (
                                <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {review.scores.map((score: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-secondary-800 rounded-lg">
                                            <span className="text-sm text-secondary-600 dark:text-secondary-400">
                                                {isAr ? score.criteriaNameAr : score.criteriaNameEn}
                                            </span>
                                            <span className="text-lg font-bold text-primary-600">{score.score}/{score.maxScore}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Review Status Banner */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${review.isChairApproved
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : review.status === 'Returned'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    }`}>
                                    {review.isChairApproved
                                        ? (isAr ? 'تم الاعتماد' : 'Approved by Chair')
                                        : review.status === 'Returned'
                                            ? (isAr ? 'تمت الإعادة للمراجعة' : 'Returned to Reviewer')
                                            : (isAr ? 'بانتظار الاعتماد' : 'Pending Approval')
                                    }
                                </span>
                            </div>

                            {/* Comments to Chairman */}
                            {review.commentsToChairman && (
                                <p className="text-sm text-secondary-600 dark:text-secondary-400 mt-2 mb-1">
                                    <span className="font-medium">{isAr ? 'تعليقات سرية للرئيس' : 'Confidential Comments'}:</span> {review.commentsToChairman}
                                </p>
                            )}
                            {/* Comments to Author */}
                            {review.commentsToAuthor && (
                                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                                    <span className="font-medium">{isAr ? 'تعليقات للمؤلف' : 'Comments to Author'}:</span> {review.commentsToAuthor}
                                </p>
                            )}

                            {/* Action Buttons - only show when not approved */}
                            {!existingDecision && !review.isChairApproved && (
                                <div className="mt-4 flex flex-col gap-2">
                                    {!review.isChairApproved && review.status !== 'Returned' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApproveReview(review.id)}
                                                className="btn-sm btn-success flex-1"
                                            >
                                                <CheckCircle className="w-4 h-4 me-1" />
                                                {isAr ? 'اعتماد المراجعة' : 'Approve Review'}
                                            </button>
                                            <button
                                                onClick={() => setReturningId(review.id === returningId ? null : review.id)}
                                                className="btn-sm btn-danger flex-1"
                                            >
                                                <Edit className="w-4 h-4 me-1" />
                                                {returningId === review.id ? t('common.cancel') : (isAr ? 'إعادة للمراجع' : 'Return to Reviewer')}
                                            </button>
                                        </div>
                                    )}

                                    {/* Return Feedback Form */}
                                    {returningId === review.id && (
                                        <div className="mt-2 p-3 bg-white dark:bg-secondary-800 rounded border border-secondary-200 dark:border-secondary-700 animate-fade-in">
                                            <label className="block text-sm font-medium mb-1">
                                                {isAr ? 'سبب الإعادة' : 'Reason for return'}
                                            </label>
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedback(e.target.value)}
                                                className="input text-sm mb-2"
                                                rows={2}
                                                placeholder={isAr ? 'اكتب ملاحظاتك للمراجع...' : 'Enter feedback for reviewer...'}
                                            />
                                            <button
                                                onClick={() => handleReturnReview(review.id)}
                                                disabled={!feedback.trim()}
                                                className="btn-sm btn-primary w-full"
                                            >
                                                <Send className="w-3 h-3 me-1" />
                                                {isAr ? 'إرسال الملاحظات' : 'Send Feedback'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {(!reviews || reviews.length === 0) && (
                        <p className="text-center text-secondary-500 py-4">
                            {isAr ? 'لا توجد مراجعات مكتملة بعد' : 'No completed reviews yet'}
                        </p>
                    )}
                </div>
            </div>

            {/* Decision Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="card">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                    {isAr ? 'اتخاذ القرار النهائي' : 'Make Final Decision'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {([
                        { value: 'Approved' as DecisionType, labelAr: 'قبول', labelEn: 'Accept', icon: CheckCircle, color: 'green' },
                        { value: 'RevisionRequired' as DecisionType, labelAr: 'مطلوب تعديل', labelEn: 'Revision Required', icon: AlertTriangle, color: 'yellow' },
                        { value: 'Rejected' as DecisionType, labelAr: 'مرفوض', labelEn: 'Rejected', icon: Ban, color: 'red' },
                    ]).map((dec) => {
                        const Icon = dec.icon;
                        const isSelected = watch('decision') === dec.value;
                        return (
                            <label
                                key={dec.value}
                                className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                    ? dec.color === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-lg' :
                                        dec.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 shadow-lg' :
                                            'border-red-500 bg-red-50 dark:bg-red-900/30 shadow-lg'
                                    : 'border-secondary-200 dark:border-secondary-700 hover:border-secondary-300'
                                    }`}
                            >
                                <input type="radio" {...register('decision')} value={dec.value} className="sr-only" />
                                <Icon className={`w-10 h-10 ${dec.color === 'green' ? 'text-green-500' :
                                    dec.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                                    }`} />
                                <span className="font-semibold text-secondary-800 dark:text-white">
                                    {isAr ? dec.labelAr : dec.labelEn}
                                </span>
                            </label>
                        );
                    })}
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{isAr ? 'المبررات' : 'Justification'}</label>
                        <textarea {...register('justification')} className="input" rows={3}
                            placeholder={isAr ? 'اكتب مبررات القرار...' : 'Provide justification for the decision...'} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{isAr ? 'تعليقات للمؤلف' : 'Comments to Author'}</label>
                        <textarea {...register('commentsToAuthor')} className="input" rows={3}
                            placeholder={isAr ? 'اكتب ملاحظاتك للمؤلف...' : 'Write feedback for the author...'} />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => navigate('/chairman')} className="btn-secondary">
                        {t('common.cancel')}
                    </button>
                    <button type="submit" disabled={isSubmitting} className="btn-primary">
                        <Send className="w-4 h-4 me-2" />
                        {isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'إصدار القرار' : 'Issue Decision')}
                    </button>
                </div>
            </form>
        </div>
    );
}
