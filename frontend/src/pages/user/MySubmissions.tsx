import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, FolderOpen, Send } from 'lucide-react';
import { researchApi } from '../../api/services';
import { Research } from '../../types';
import toast from 'react-hot-toast';

export default function MySubmissions() {
    const { t, i18n } = useTranslation();
    const [submissions, setSubmissions] = useState<Research[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const data = await researchApi.getMySubmissions();
                setSubmissions(data);
            } catch {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubmissions();
    }, [t]);

    const getStatusInfo = (research: Research) => {
        const status = research.status;
        const info = {
            labelAr: '',
            labelEn: '',
            className: ''
        };

        switch (status) {
            case 'Draft':
                info.labelAr = 'مسودة';
                info.labelEn = 'Draft';
                info.className = 'badge-secondary';
                break;
            case 'Submitted':
                info.labelAr = 'تم الإرسال وجاري المراجعة';
                info.labelEn = 'Sent and Under Review';
                info.className = 'badge-primary';
                break;
            case 'UnderReview':
                info.labelAr = 'قيد المراجعة';
                info.labelEn = 'Under Review';
                info.className = 'badge-warning';
                break;
            case 'ReviewCompleted':
                info.labelAr = 'تم التقييم وجاري الاعتماد';
                info.labelEn = 'Reviewed and Awaiting Approval';
                info.className = 'badge-info';
                break;
            case 'Approved':
                info.labelAr = `تم التقييم ${research.averageScore ? `(${research.averageScore.toFixed(1)}/100)` : ''}`;
                info.labelEn = `Evaluated ${research.averageScore ? `(${research.averageScore.toFixed(1)}/100)` : ''}`;
                info.className = 'badge-success';
                break;
            case 'Rejected':
                info.labelAr = 'مرفوض';
                info.labelEn = 'Rejected';
                info.className = 'badge-danger';
                break;
            case 'RevisionRequired':
                info.labelAr = 'مطلوب تعديلات';
                info.labelEn = 'Revision Required';
                info.className = 'badge-warning';
                break;
            default:
                info.labelAr = status;
                info.labelEn = status;
                info.className = 'badge-secondary';
        }
        return info;
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('common.confirmDelete') || 'Are you sure you want to delete this draft?')) return;
        try {
            await researchApi.delete(id);
            setSubmissions(prev => prev.filter(r => r.id !== id));
            toast.success(t('common.success'));
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    const handleSubmitResearch = async (id: string) => {
        const confirmMsg = i18n.language === 'ar'
            ? 'هل أنت متأكد من تقديم البحث للمراجعة؟ لن تتمكن من تعديله بعد ذلك.'
            : 'Are you sure you want to submit this research for review? You will not be able to edit it afterwards.';
        if (!confirm(confirmMsg)) return;
        setSubmittingId(id);
        try {
            const updated = await researchApi.submit(id);
            setSubmissions(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
            toast.success(i18n.language === 'ar' ? 'تم تقديم البحث بنجاح' : 'Research submitted successfully');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setSubmittingId(null);
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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                    {t('research.mySubmissions')}
                </h1>
                <Link to="/my-submissions/new" className="btn-primary">
                    <Plus className="w-4 h-4 me-2" />
                    {t('research.newSubmission')}
                </Link>
            </div>

            {submissions.length > 0 ? (
                <div className="grid gap-4">
                    {submissions.map((research) => {
                        const statusInfo = getStatusInfo(research);
                        return (
                            <div
                                key={research.id}
                                className="card hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <Link to={`/my-submissions/${research.id}`} className="flex items-start gap-4 flex-1">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-secondary-800 dark:text-white mb-1">
                                                {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                                            </h3>
                                            <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                                                {research.submissionNumber} • {research.conferenceName}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <span className={`badge ${statusInfo.className}`}>
                                                    {i18n.language === 'ar' ? statusInfo.labelAr : statusInfo.labelEn}
                                                </span>
                                                {research.submittedAt && (
                                                    <span className="text-xs text-secondary-500">
                                                        {new Date(research.submittedAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    {research.status === 'Draft' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleSubmitResearch(research.id)}
                                                disabled={submittingId === research.id}
                                                className="btn-ghost text-sm text-green-600 hover:text-green-800 flex items-center gap-1"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                {submittingId === research.id
                                                    ? (i18n.language === 'ar' ? 'جاري التقديم...' : 'Submitting...')
                                                    : (i18n.language === 'ar' ? 'تقديم البحث' : 'Submit')}
                                            </button>
                                            <Link
                                                to={`/my-submissions/edit/${research.id}`}
                                                className="btn-ghost text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                {i18n.language === 'ar' ? 'تعديل' : 'Edit'}
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(research.id)}
                                                className="btn-ghost text-sm text-red-600 hover:text-red-800"
                                            >
                                                {i18n.language === 'ar' ? 'حذف' : 'Delete'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="card text-center py-16">
                    <FolderOpen className="w-16 h-16 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-800 dark:text-white mb-2">
                        {i18n.language === 'ar' ? 'لا توجد أبحاث مقدمة' : 'No Submissions Yet'}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                        {i18n.language === 'ar' ? 'ابدأ بتقديم بحثك الأول' : 'Start by submitting your first research'}
                    </p>
                    <Link to="/my-submissions/new" className="btn-primary inline-flex">
                        <Plus className="w-4 h-4 me-2" />
                        {t('research.newSubmission')}
                    </Link>
                </div>
            )}
        </div>
    );
}
