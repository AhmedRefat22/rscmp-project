import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Plus, MapPin, FileText } from 'lucide-react';
import { conferencesApi } from '../../api/services';
import { Conference } from '../../types';
import toast from 'react-hot-toast';

export default function ConferencesPage() {
    const { t, i18n } = useTranslation();
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConferences = async () => {
            try {
                const data = await conferencesApi.getAll();
                setConferences(data);
            } catch {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchConferences();
    }, [t]);

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                    {t('admin.conferences')}
                </h1>
                <Link to="/admin/conferences/new" className="btn-primary">
                    <Plus className="w-4 h-4 me-2" />
                    {i18n.language === 'ar' ? 'إضافة مؤتمر' : 'Add Conference'}
                </Link>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
            ) : conferences.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {conferences.map((conf) => (
                        <Link to={`/admin/conferences/${conf.id}`} key={conf.id} className="card hover:shadow-lg transition-shadow block cursor-pointer group overflow-hidden p-0">
                            <div className="relative h-48 w-full bg-secondary-100 dark:bg-secondary-800">
                                <img
                                    src={conf.bannerUrl || 'https://placehold.co/600x400?text=Conference'}
                                    alt={i18n.language === 'ar' ? conf.nameAr : conf.nameEn}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Conference')}
                                />
                                <div className="absolute top-4 start-4">
                                    <span className={`badge ${conf.isActive ? 'badge-success' : 'badge-secondary'} shadow-sm`}>
                                        {conf.isActive ? (i18n.language === 'ar' ? 'نشط' : 'Active') : (i18n.language === 'ar' ? 'أرشيف' : 'Archived')}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                                    {i18n.language === 'ar' ? conf.nameAr : conf.nameEn}
                                </h3>

                                <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-4 h-10">
                                    {i18n.language === 'ar' ? conf.descriptionAr : conf.descriptionEn}
                                </p>

                                <div className="space-y-2 pt-4 border-t border-secondary-100 dark:border-secondary-700">
                                    <div className="flex items-center text-sm text-secondary-500">
                                        <MapPin className="w-4 h-4 me-2" />
                                        <span>{conf.location || 'Online'}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-secondary-500">
                                        <FileText className="w-4 h-4 me-2" />
                                        <span>{conf.researchCount || 0} {i18n.language === 'ar' ? 'أبحاث' : 'Researches'}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="card text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-800 dark:text-white mb-2">
                        {i18n.language === 'ar' ? 'لا توجد مؤتمرات' : 'No Conferences Found'}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400">
                        {i18n.language === 'ar' ? 'ابدأ بإضافة مؤتمر جديد' : 'Start by adding a new conference'}
                    </p>
                </div>
            )}
        </div>
    );
}
