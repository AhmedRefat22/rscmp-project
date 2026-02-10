import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Globe, FileText, CheckCircle, Save, Edit } from 'lucide-react';
import { conferencesApi } from '../../api/services';
import { Conference } from '../../types';

export default function ConferenceDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [conference, setConference] = useState<Conference | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset } = useForm<Partial<Conference>>();

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                // Fetch conference data
                const confData = await conferencesApi.getById(id);
                setConference(confData);
                reset(confData);

                // Try to fetch stats, but don't fail if not available
                try {
                    const statsData = await conferencesApi.getStatistics(id);
                    setStats(statsData);
                } catch (e) {
                    console.error('Failed to load stats', e);
                }
            } catch {
                toast.error(t('errors.notFound'));
                navigate('/admin/conferences');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, navigate, t, reset]);

    const onSubmit = async (data: Partial<Conference>) => {
        if (!id) return;
        setIsSaving(true);
        try {
            const updated = await conferencesApi.update(id, data);
            setConference(updated);
            setIsEditing(false);
            toast.success(t('common.success'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!conference) return null;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <button onClick={() => navigate('/admin/conferences')} className="btn-ghost mb-6">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-2">
                        {i18n.language === 'ar' ? conference.nameAr : conference.nameEn}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400">
                        <span className={`badge ${conference.isActive ? 'badge-success' : 'badge-secondary'}`}>
                            {conference.isActive ? (i18n.language === 'ar' ? 'نشط' : 'Active') : (i18n.language === 'ar' ? 'أرشيف' : 'Archived')}
                        </span>
                        <span>{new Date(conference.startDate).toLocaleDateString()} - {new Date(conference.endDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="btn-secondary"
                >
                    <Edit className="w-4 h-4 me-2" />
                    {isEditing ? t('common.cancel') : t('common.edit')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content / Edit Form */}
                <div className="lg:col-span-2">
                    <div className="card">
                        {isEditing ? (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Name (EN)</label>
                                        <input {...register('nameEn')} className="input" dir="ltr" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">الاسم (AR)</label>
                                        <input {...register('nameAr')} className="input" dir="rtl" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description (EN)</label>
                                    <textarea {...register('descriptionEn')} className="input h-32" dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">الوصف (AR)</label>
                                    <textarea {...register('descriptionAr')} className="input h-32" dir="rtl" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Start Date</label>
                                        <input type="date" {...register('startDate')} className="input" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">End Date</label>
                                        <input type="date" {...register('endDate')} className="input" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Submission Deadline</label>
                                        <input type="date" {...register('submissionDeadline')} className="input" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Review Deadline</label>
                                        <input type="date" {...register('reviewDeadline')} className="input" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...register('isActive')} className="checkbox" />
                                        <span>Is Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" {...register('acceptingSubmissions')} className="checkbox" />
                                        <span>Accepting Submissions</span>
                                    </label>
                                </div>
                                <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 flex justify-end">
                                    <button type="submit" disabled={isSaving} className="btn-primary">
                                        <Save className="w-4 h-4 me-2" />
                                        {isSaving ? t('common.loading') : t('common.save')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-secondary-800 dark:text-white mb-2">{t('common.description')}</h3>
                                    <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                                        {i18n.language === 'ar' ? conference.descriptionAr : conference.descriptionEn}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-secondary-400 mt-1" />
                                        <div>
                                            <p className="font-medium text-secondary-800 dark:text-white">{t('admin.conferences')}</p>
                                            <p className="text-sm text-secondary-600 dark:text-secondary-400">{conference.location || 'Online'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Globe className="w-5 h-5 text-secondary-400 mt-1" />
                                        <div>
                                            <p className="font-medium text-secondary-800 dark:text-white">Website</p>
                                            <a href={conference.website || '#'} target="_blank" rel="noreferrer" className="text-sm text-primary-600 hover:underscore">
                                                {conference.website || 'N/A'}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar / Stats */}
                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-semibold text-secondary-800 dark:text-white mb-4">Deadlines</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-secondary-600 dark:text-secondary-400">Submission</span>
                                <span className="text-sm font-medium">{new Date(conference.submissionDeadline).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-secondary-600 dark:text-secondary-400">Review</span>
                                <span className="text-sm font-medium">{new Date(conference.reviewDeadline).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="font-semibold text-secondary-800 dark:text-white mb-4">Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                <FileText className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{conference.researchCount || stats?.totalResearches || 0}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Researches</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                                <CheckCircle className="w-6 h-6 mx-auto text-green-500 mb-1" />
                                <p className="text-xl font-bold text-green-700 dark:text-green-300">{stats?.acceptedResearches || '-'}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Accepted</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
