import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Send, Mail, User, MessageSquare, MapPin, Phone, Clock } from 'lucide-react';
import { contactApi } from '../api/services';
import { ContactCreateRequest } from '../types';

const contactSchema = z.object({
    name: z.string().min(2, 'Name is required | الاسم مطلوب'),
    email: z.string().email('Invalid email | البريد الإلكتروني غير صالح'),
    subject: z.string().min(5, 'Subject is required | الموضوع مطلوب'),
    message: z.string().min(20, 'Message must be at least 20 characters | الرسالة يجب أن تكون 20 حرفاً على الأقل'),
});

export default function ContactPage() {
    const { t, i18n } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactCreateRequest>({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = async (data: ContactCreateRequest) => {
        setIsLoading(true);
        try {
            await contactApi.submit(data);
            setIsSubmitted(true);
            reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="py-16 px-4 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white mb-4">
                        {t('contact.title')}
                    </h1>
                    <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
                        {t('contact.subtitle')}
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="card">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-secondary-800 dark:text-white mb-1">
                                        {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                                    </h3>
                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">contact@rscmp.edu</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-secondary-800 dark:text-white mb-1">
                                        {i18n.language === 'ar' ? 'الهاتف' : 'Phone'}
                                    </h3>
                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">+966 XX XXX XXXX</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-secondary-800 dark:text-white mb-1">
                                        {i18n.language === 'ar' ? 'العنوان' : 'Address'}
                                    </h3>
                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                                        {i18n.language === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-secondary-800 dark:text-white mb-1">
                                        {i18n.language === 'ar' ? 'ساعات العمل' : 'Working Hours'}
                                    </h3>
                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                                        {i18n.language === 'ar' ? 'الأحد - الخميس: 8 ص - 4 م' : 'Sun - Thu: 8 AM - 4 PM'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="card">
                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                                        <Send className="w-10 h-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-secondary-800 dark:text-white mb-2">
                                        {t('contact.successTitle')}
                                    </h2>
                                    <p className="text-secondary-600 dark:text-secondary-400 mb-6">
                                        {t('contact.successMessage')}
                                    </p>
                                    <button onClick={() => setIsSubmitted(false)} className="btn-secondary">
                                        {i18n.language === 'ar' ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">{t('contact.name')}</label>
                                            <div className="relative">
                                                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                                <input
                                                    {...register('name')}
                                                    className={`input ps-10 ${errors.name ? 'input-error' : ''}`}
                                                    placeholder={i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                                                />
                                            </div>
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1.5">{t('contact.email')}</label>
                                            <div className="relative">
                                                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                                <input
                                                    {...register('email')}
                                                    type="email"
                                                    className={`input ps-10 ${errors.email ? 'input-error' : ''}`}
                                                    placeholder="your@email.com"
                                                    dir="ltr"
                                                />
                                            </div>
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t('contact.subject')}</label>
                                        <input
                                            {...register('subject')}
                                            className={`input ${errors.subject ? 'input-error' : ''}`}
                                            placeholder={i18n.language === 'ar' ? 'موضوع الرسالة' : 'Message Subject'}
                                        />
                                        {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5">{t('contact.message')}</label>
                                        <div className="relative">
                                            <MessageSquare className="absolute start-3 top-3 w-5 h-5 text-secondary-400" />
                                            <textarea
                                                {...register('message')}
                                                className={`input ps-10 ${errors.message ? 'input-error' : ''}`}
                                                rows={6}
                                                placeholder={i18n.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                            />
                                        </div>
                                        {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
                                    </div>

                                    <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
                                        <Send className="w-4 h-4 me-2" />
                                        {isLoading ? t('common.loading') : t('contact.send')}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
