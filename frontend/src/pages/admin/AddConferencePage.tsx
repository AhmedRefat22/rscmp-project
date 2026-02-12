import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Calendar, Globe, Loader2, Image as ImageIcon } from 'lucide-react';
import { conferencesApi } from '../../api/services';

const conferenceSchema = z.object({
    nameEn: z.string().min(3, 'English name is required'),
    nameAr: z.string().min(3, 'Arabic name is required'),
    descriptionEn: z.string().optional(),
    descriptionAr: z.string().optional(),
    // location: z.string().min(2, 'Location is required'), // Removed per request
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    // submissionDeadline: z.string().min(1, 'Submission deadline is required'), // Removed - using EndDate
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    // Files
    bannerImage: z.any().optional(),
    logoImage: z.any().optional(),
});

type ConferenceFormData = z.infer<typeof conferenceSchema>;

export default function AddConferencePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<ConferenceFormData>({
        resolver: zodResolver(conferenceSchema),
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setPreview: (url: string | null) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    const onSubmit = async (data: ConferenceFormData) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('nameEn', data.nameEn);
            formData.append('nameAr', data.nameAr);
            formData.append('descriptionEn', data.descriptionEn || '');
            formData.append('descriptionAr', data.descriptionAr || '');
            // formData.append('location', data.location); // Removed
            formData.append('startDate', data.startDate);
            formData.append('endDate', data.endDate);
            formData.append('submissionDeadline', data.endDate); // Default to end date
            if (data.website) formData.append('website', data.website);

            if (data.bannerImage && data.bannerImage.length > 0) {
                formData.append('bannerImage', data.bannerImage[0]);
            }
            if (data.logoImage && data.logoImage.length > 0) {
                formData.append('logoImage', data.logoImage[0]);
            }

            formData.append('isActive', 'true');
            formData.append('acceptingSubmissions', 'true');

            await conferencesApi.create(formData);
            toast.success(t('common.success'));
            navigate('/admin/conferences');
        } catch (error) {
            console.error(error);
            toast.error(t('errors.serverError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-6">
                {i18n.language === 'ar' ? 'إضافة مؤتمر جديد' : 'Add New Conference'}
            </h1>

            <div className="card">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                            </label>
                            <input
                                {...register('nameEn')}
                                className={`input ${errors.nameEn ? 'input-error' : ''}`}
                                dir="ltr"
                            />
                            {errors.nameEn && <p className="text-red-500 text-sm mt-1">{errors.nameEn.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                            </label>
                            <input
                                {...register('nameAr')}
                                className={`input ${errors.nameAr ? 'input-error' : ''}`}
                                dir="rtl"
                            />
                            {errors.nameAr && <p className="text-red-500 text-sm mt-1">{errors.nameAr.message}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
                            </label>
                            <textarea
                                {...register('descriptionEn')}
                                className="input min-h-[100px]"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
                            </label>
                            <textarea
                                {...register('descriptionAr')}
                                className="input min-h-[100px]"
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Dates & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Location Removed */}
                        {/* <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'الموقع' : 'Location'}
                            </label>
                            <div className="relative">
                                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    {...register('location')}
                                    className={`input ps-10 ${errors.location ? 'input-error' : ''}`}
                                />
                            </div>
                            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                        </div> */}
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'الموقع الإلكتروني (اختياري)' : 'Website (Optional)'}
                            </label>
                            <div className="relative">
                                <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    {...register('website')}
                                    className={`input ps-10 ${errors.website ? 'input-error' : ''}`}
                                    placeholder="https://..."
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="date"
                                    {...register('startDate')}
                                    className={`input ps-10 ${errors.startDate ? 'input-error' : ''}`}
                                />
                            </div>
                            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                            </label>
                            <div className="relative">
                                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="date"
                                    {...register('endDate')}
                                    className={`input ps-10 ${errors.endDate ? 'input-error' : ''}`}
                                />
                            </div>
                            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'صورة شعار المؤتمر (اختياري)' : 'Conference Logo (Optional)'}
                            </label>
                            <div className="relative">
                                <ImageIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register('logoImage', {
                                        onChange: (e) => handleFileChange(e, setLogoPreview)
                                    })}
                                    className="file-input w-full ps-10"
                                />
                            </div>
                            {logoPreview && (
                                <div className="mt-2 rounded-lg overflow-hidden h-24 w-24 border border-secondary-200">
                                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                                {i18n.language === 'ar' ? 'صورة الغلاف' : 'Banner Image'}
                            </label>
                            <div className="relative">
                                <ImageIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register('bannerImage', {
                                        onChange: (e) => handleFileChange(e, setBannerPreview)
                                    })}
                                    className="file-input w-full ps-10"
                                />
                            </div>
                            {bannerPreview && (
                                <div className="mt-2 rounded-lg overflow-hidden h-32 w-full border border-secondary-200">
                                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/conferences')}
                            className="btn-ghost me-3"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                            {i18n.language === 'ar' ? 'إنشاء المؤتمر' : 'Create Conference'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
