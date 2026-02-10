import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, FolderOpen } from 'lucide-react';
import { researchApi } from '../../api/services';
import { Research } from '../../types';
import toast from 'react-hot-toast';

export default function MySubmissions() {
    const { t, i18n } = useTranslation();
    const [submissions, setSubmissions] = useState<Research[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            Draft: 'badge-secondary',
            Submitted: 'badge-primary',
            UnderReview: 'badge-warning',
            ReviewCompleted: 'badge-info',
            Approved: 'badge-success',
            Rejected: 'badge-danger',
            RevisionRequired: 'badge-warning',
        };
        return colors[status] || 'badge-secondary';
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
                    {submissions.map((research) => (
                        <Link
                            key={research.id}
                            to={`/my-submissions/${research.id}`}
                            className="card hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
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
                                            <span className={`badge ${getStatusColor(research.status)}`}>
                                                {t(`research.status.${research.status.toLowerCase()}`)}
                                            </span>
                                            {research.submittedAt && (
                                                <span className="text-xs text-secondary-500">
                                                    {new Date(research.submittedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
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
