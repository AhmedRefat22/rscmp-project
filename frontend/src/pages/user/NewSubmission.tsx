import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Upload, Send, Save } from 'lucide-react';
import { conferencesApi, researchApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { Conference, ResearchCreateRequest } from '../../types';

export default function NewSubmission() {
    const { id } = useParams<{ id: string }>(); // Check if we are in edit mode
    const isEditMode = !!id;
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const { user } = useAuthStore();
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ResearchCreateRequest>({
        defaultValues: {
            authors: [{
                fullNameEn: user?.fullNameEn || '',
                fullNameAr: user?.fullNameAr || '',
                email: user?.email || '',
                isCorresponding: true
            }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'authors' });

    // Fetch research data if in edit mode
    useEffect(() => {
        if (!isEditMode) return;

        const fetchResearch = async () => {
            try {
                if (!id) return;
                const research = await researchApi.getById(id);

                // Map research data to form values
                reset({
                    conferenceId: research.conferenceId,
                    titleEn: research.titleEn,
                    titleAr: research.titleAr,
                    abstractEn: research.abstractEn,
                    abstractAr: research.abstractAr,
                    topicArea: research.topicArea || '',
                    authors: research.authors.map(a => ({
                        fullNameEn: a.fullName, // Adjust as best as we can since DB only sends FullName
                        fullNameAr: '', // Cannot recover Ar name if not stored separately
                        email: a.email,
                        isCorresponding: a.isCorresponding
                    }))
                });
            } catch {
                toast.error(t('errors.notFound'));
                navigate('/my-submissions');
            }
        };
        fetchResearch();
    }, [id, isEditMode, navigate, reset, t]);

    useEffect(() => {
        const fetchConferences = async () => {
            try {
                const data = await conferencesApi.getAll(true);
                setConferences(data.filter(c => c.acceptingSubmissions));
            } catch {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchConferences();
    }, [t]);


    useEffect(() => {
        if (!isEditMode && user && fields.length === 0) {
            append({
                fullNameEn: user.fullNameEn,
                fullNameAr: user.fullNameAr,
                email: user.email,
                isCorresponding: true
            });
        }
    }, [user, append, fields.length, isEditMode]);

    const onSubmit = async (data: ResearchCreateRequest) => {
        setIsSubmitting(true);
        try {
            // Map authors to match backend DTO (frontend has fullNameEn/Ar, backend expects FullName)
            const submissionData = {
                ...data,
                keywords: '',
                authors: data.authors.map(a => ({
                    ...a,
                    fullName: a.fullNameEn || a.fullNameAr // Fallback
                }))
            };

            let researchId = id;
            if (isEditMode && id) {
                await researchApi.update(id, submissionData);
                toast.success(t('common.success'));
            } else {
                const research = await researchApi.create(submissionData);
                researchId = research.id;
                toast.success(t('common.success'));
            }

            if (file && researchId) {
                await researchApi.uploadFile(researchId, file);
            }

            navigate('/my-submissions');
        } catch (error: any) {
            console.error(error);
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

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <button onClick={() => navigate('/my-submissions/list')} className="btn-ghost mb-4">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            <div className="card">
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-6">
                    {isEditMode ? (i18n.language === 'ar' ? 'تعديل البحث' : 'Edit Submission') : t('research.newSubmission')}
                </h1>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Conference Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('research.conference')}</label>
                        <select {...register('conferenceId', { required: true })} className="input">
                            <option value="">{i18n.language === 'ar' ? 'اختر المؤتمر' : 'Select Conference'}</option>
                            {conferences.map(conf => (
                                <option key={conf.id} value={conf.id}>
                                    {i18n.language === 'ar' ? conf.nameAr : conf.nameEn}
                                </option>
                            ))}
                        </select>
                        {errors.conferenceId && <p className="text-red-500 text-sm mt-1">{t('validation.required')}</p>}
                    </div>

                    {/* Titles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('research.titleEn')}</label>
                            <input
                                {...register('titleEn', { required: true, minLength: 10 })}
                                className="input"
                                placeholder="Research Title in English"
                                dir="ltr"
                            />
                            {errors.titleEn && <p className="text-red-500 text-sm mt-1">{t('validation.required')}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('research.titleAr')}</label>
                            <input
                                {...register('titleAr', { required: true, minLength: 10 })}
                                className="input"
                                placeholder="عنوان البحث بالعربية"
                                dir="rtl"
                            />
                            {errors.titleAr && <p className="text-red-500 text-sm mt-1">{t('validation.required')}</p>}
                        </div>
                    </div>

                    {/* Abstracts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('research.abstractEn')}</label>
                            <textarea
                                {...register('abstractEn')}
                                className="input"
                                rows={5}
                                placeholder="Abstract in English..."
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('research.abstractAr')}</label>
                            <textarea
                                {...register('abstractAr')}
                                className="input"
                                rows={5}
                                placeholder="الملخص بالعربية..."
                                dir="rtl"
                            />
                        </div>
                    </div>

                    {/* Topic Area Only - Keywords Removed */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('research.topicArea')}</label>
                        <input {...register('topicArea')} className="input" placeholder="e.g., Machine Learning" />
                    </div>

                    {/* Authors */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium">{t('research.authors')}</label>
                            <button
                                type="button"
                                onClick={() => append({ fullNameEn: '', fullNameAr: '', email: '', isCorresponding: false })}
                                className="btn-ghost text-sm"
                            >
                                <Plus className="w-4 h-4 me-1" />
                                {i18n.language === 'ar' ? 'إضافة مؤلف' : 'Add Author'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input
                                            {...register(`authors.${index}.fullNameEn` as const, { required: true })}
                                            className="input"
                                            placeholder="Name (English)"
                                        />
                                        <input
                                            {...register(`authors.${index}.fullNameAr` as const)}
                                            className="input"
                                            placeholder="الاسم (عربي)"
                                            dir="rtl"
                                        />
                                        <input
                                            {...register(`authors.${index}.email` as const, { required: true })}
                                            type="email"
                                            className="input"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...register(`authors.${index}.isCorresponding` as const)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-sm text-secondary-600 dark:text-secondary-400">
                                                {i18n.language === 'ar' ? 'المؤلف المراسل' : 'Corresponding Author'}
                                            </span>
                                        </label>
                                        {fields.length > 1 && (
                                            <button type="button" onClick={() => remove(index)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">{t('research.uploadFile')}</label>
                        <div className="border-2 border-dashed border-secondary-300 dark:border-secondary-600 rounded-xl p-8 text-center">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="w-10 h-10 mx-auto text-secondary-400 mb-3" />
                                {file ? (
                                    <p className="text-primary-600 font-medium">{file.name}</p>
                                ) : (
                                    <>
                                        <p className="text-secondary-600 dark:text-secondary-400">
                                            {i18n.language === 'ar' ? 'اسحب الملف هنا أو انقر للتحميل' : 'Drag file here or click to upload'}
                                        </p>
                                        <p className="text-sm text-secondary-500 mt-1">PDF only, max 10MB</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
                        <button type="button" onClick={() => navigate('/my-submissions')} className="btn-secondary">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary">
                            {isEditMode ? <Save className="w-4 h-4 me-2" /> : <Send className="w-4 h-4 me-2" />}
                            {isSubmitting ? t('common.loading') : (isEditMode ? (i18n.language === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (i18n.language === 'ar' ? 'حفظ كمسودة' : 'Save Draft'))}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
