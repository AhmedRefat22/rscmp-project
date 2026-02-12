import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, FileText, Download, Upload, Send, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';
import { researchApi } from '../../api/services';
import { Research } from '../../types';

export default function SubmissionDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [research, setResearch] = useState<Research | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const data = await researchApi.getById(id);
                setResearch(data);
            } catch {
                toast.error(t('errors.notFound'));
                navigate('/my-submissions');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, t]);

    const handleSubmit = async () => {
        if (!id || !confirm(i18n.language === 'ar' ? 'هل أنت متأكد من تقديم البحث؟' : 'Are you sure you want to submit?')) return;
        try {
            const updated = await researchApi.submit(id);
            setResearch(updated);
            toast.success(t('common.success'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setIsUploading(true);
        try {
            await researchApi.uploadFile(id, file);
            const updated = await researchApi.getById(id);
            setResearch(updated);
            toast.success('File uploaded | تم رفع الملف');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Upload failed');
        } finally {
            setIsUploading(false);
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

    if (!research) return null;

    const statusConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
        Draft: { icon: Clock, color: 'text-secondary-500', bgColor: 'bg-secondary-100 dark:bg-secondary-700' },
        Submitted: { icon: Send, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
        UnderReview: { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
        ReviewCompleted: { icon: CheckCircle, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
        Approved: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
        Rejected: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
        RevisionRequired: { icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
    };

    const config = statusConfig[research.status] || statusConfig.Draft;
    const StatusIcon = config.icon;

    // Check if there are any comments to show
    const hasReviewerComments = research.reviews && research.reviews.some(r => r.commentsToAuthor);
    const hasDecisionComments = research.decision && research.decision.commentsToAuthor;
    const hasAnyComments = hasReviewerComments || hasDecisionComments;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <button onClick={() => navigate('/my-submissions')} className="btn-ghost mb-4">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            {/* Status Banner */}
            <div className={`${config.bgColor} rounded-xl p-6 mb-6`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${config.color} bg-white dark:bg-secondary-800`}>
                        <StatusIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{t('common.status')}</p>
                        <h2 className={`text-xl font-bold ${config.color}`}>
                            {t(`research.status.${research.status.toLowerCase()}`)}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Research Details */}
            <div className="card mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <span className="text-sm text-secondary-500">{research.submissionNumber}</span>
                        <h1 className="text-xl font-bold text-secondary-800 dark:text-white">
                            {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-medium text-secondary-800 dark:text-white mb-2">{t('research.abstractEn')}</h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{research.abstractEn || 'N/A'}</p>
                    </div>
                    <div>
                        <h3 className="font-medium text-secondary-800 dark:text-white mb-2">{t('research.abstractAr')}</h3>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400" dir="rtl">{research.abstractAr || 'N/A'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                    <div>
                        <p className="text-sm text-secondary-500">{t('research.conference')}</p>
                        <p className="font-medium text-secondary-800 dark:text-white">{research.conferenceName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-secondary-500">{t('research.topicArea')}</p>
                        <p className="font-medium text-secondary-800 dark:text-white">{research.topicArea || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-secondary-500">{t('research.submittedAt')}</p>
                        <p className="font-medium text-secondary-800 dark:text-white">
                            {research.submittedAt ? new Date(research.submittedAt).toLocaleDateString() : 'Not submitted'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-secondary-500">{i18n.language === 'ar' ? 'مقدم البحث' : 'Submitted By'}</p>
                        <p className="font-medium text-secondary-800 dark:text-white">{research.submitterName || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Authors */}
            <div className="card mb-6">
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">{t('research.authors')}</h2>
                <div className="space-y-3">
                    {research.authors?.map((author, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                            <div>
                                <p className="font-medium text-secondary-800 dark:text-white">
                                    {i18n.language === 'ar' ? author.fullNameAr : author.fullNameEn}
                                </p>
                                <p className="text-sm text-secondary-500">{author.email}</p>
                            </div>
                            {author.isCorresponding && (
                                <span className="badge badge-primary text-xs">
                                    {i18n.language === 'ar' ? 'المؤلف المراسل' : 'Corresponding'}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback & Comments Section */}
            {research.status !== 'Draft' && hasAnyComments && (
                <div className="card mb-6">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary-500" />
                        {t('common.results')}
                    </h2>

                    {/* Overall Score if available */}
                    {research.averageScore !== undefined && research.averageScore !== null && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg flex items-center justify-between border border-primary-100 dark:border-primary-800/30">
                            <span className="font-medium text-secondary-800 dark:text-white">
                                {i18n.language === 'ar' ? 'الدرجة الإجمالية' : 'Overall Score'}
                            </span>
                            <span className="text-2xl font-bold text-primary-600">{research.averageScore.toFixed(1)}</span>
                        </div>
                    )}

                    {/* Reviewer Comments */}
                    {hasReviewerComments && (
                        <div className="mb-6">
                            <h3 className="font-medium text-secondary-800 dark:text-white flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-blue-500" />
                                {i18n.language === 'ar' ? 'تعليقات المراجعين' : 'Reviewer Comments'}
                            </h3>
                            <div className="space-y-3">
                                {research.reviews!.map((review, idx) => (
                                    review.commentsToAuthor && (
                                        <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                                                    {i18n.language === 'ar' ? `مراجع ${idx + 1}` : `Reviewer ${idx + 1}`}
                                                </span>
                                                {review.overallScore !== undefined && review.overallScore !== null && (
                                                    <span className="text-xs text-secondary-500">
                                                        {i18n.language === 'ar' ? `الدرجة: ${review.overallScore}` : `Score: ${review.overallScore}`}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
                                                {review.commentsToAuthor}
                                            </p>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chairman Decision Comments */}
                    {hasDecisionComments && (
                        <div>
                            <h3 className="font-medium text-secondary-800 dark:text-white flex items-center gap-2 mb-3">
                                <CheckCircle className="w-4 h-4 text-purple-500" />
                                {i18n.language === 'ar' ? 'تعليقات رئيس اللجنة' : 'Chairman Comments'}
                            </h3>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">
                                        {i18n.language === 'ar' ? 'قرار رئيس اللجنة' : 'Chairman Decision'}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${research.decision!.decision === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                                        research.decision!.decision === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                            'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                        }`}>
                                        {research.decision!.decision === 'Approved' ? (i18n.language === 'ar' ? 'مقبول' : 'Approved') :
                                            research.decision!.decision === 'Rejected' ? (i18n.language === 'ar' ? 'مرفوض' : 'Rejected') :
                                                (i18n.language === 'ar' ? 'يحتاج تعديل' : 'Revision Required')}
                                    </span>
                                </div>
                                <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
                                    {research.decision!.commentsToAuthor}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Files */}
            <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white">{t('research.uploadFile')}</h2>
                    {research.status === 'Draft' && (
                        <label className="btn-secondary cursor-pointer">
                            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                            <Upload className="w-4 h-4 me-2" />
                            {isUploading ? t('common.loading') : 'Upload'}
                        </label>
                    )}
                </div>
                {research.files && research.files.length > 0 ? (
                    <div className="space-y-2">
                        {research.files.map((file) => (
                            <button
                                key={file.id}
                                onClick={() => downloadFile(file.id, file.originalFileName)}
                                className="flex items-center justify-between w-full p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-red-500" />
                                    <div className="text-start">
                                        <p className="font-medium text-secondary-800 dark:text-white">{file.originalFileName}</p>
                                        <p className="text-xs text-secondary-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-primary-600" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-secondary-500 py-4">{t('common.noData')}</p>
                )}
            </div>

            {/* Actions */}
            {research.status === 'Draft' && (
                <div className="card">
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                        {i18n.language === 'ar'
                            ? 'بمجرد تقديم البحث، لن تتمكن من تعديله.'
                            : 'Once submitted, you will not be able to edit your research.'}
                    </p>
                    <div className="flex gap-4">
                        <button onClick={() => navigate(`/my-submissions/edit/${research.id}`)} className="btn-secondary">
                            {i18n.language === 'ar' ? 'تعديل البيانات' : 'Edit Details'}
                        </button>
                        <button onClick={handleSubmit} className="btn-primary">
                            <Send className="w-4 h-4 me-2" />
                            {t('research.submitResearch')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
