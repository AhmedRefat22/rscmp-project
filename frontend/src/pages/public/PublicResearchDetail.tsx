import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Calendar, Tag, Globe } from 'lucide-react';
import { researchApi } from '../../api/services';
import { Research } from '../../types';

export default function PublicResearchDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [research, setResearch] = useState<Research | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResearch = async () => {
            if (!id) return;
            try {
                const data = await researchApi.getById(id);
                setResearch(data);
            } catch {
                toast.error(t('errors.notFound'));
                navigate('/research');
            } finally {
                setIsLoading(false);
            }
        };
        fetchResearch();
    }, [id, navigate, t]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!research) return null;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto py-8 px-4">
            <button onClick={() => navigate('/research')} className="btn-ghost mb-6">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            {/* Header */}
            <div className="card mb-8">
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(research.submittedAt || Date.now()).toLocaleDateString()}</span>
                        <span className="mx-2">•</span>
                        <Globe className="w-4 h-4" />
                        <span>{research.conferenceName}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-secondary-800 dark:text-white mb-4">
                        {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                    </h1>
                </div>

                {/* Authors */}
                <div className="flex flex-wrap gap-4 pt-6 border-t border-secondary-200 dark:border-secondary-700">
                    {research.authors?.map((author, index) => (
                        <div key={index} className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                            <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                            <span className="font-medium">
                                {i18n.language === 'ar' ? author.fullNameAr : author.fullNameEn}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Abstract */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                        {t('research.abstractEn')}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                        {research.abstractEn || 'N/A'}
                    </p>
                </div>
                <div className="card">
                    <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary-500 rounded-full"></span>
                        {t('research.abstractAr')}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed" dir="rtl">
                        {research.abstractAr || 'N/A'}
                    </p>
                </div>
            </div>

            {/* Topic Area */}
            <div className="card mt-6">
                <h3 className="font-medium text-secondary-800 dark:text-white mb-2">{t('research.topicArea')}</h3>
                <p className="text-secondary-600 dark:text-secondary-400">{research.topicArea || 'N/A'}</p>
            </div>
        </div>
    );
}
