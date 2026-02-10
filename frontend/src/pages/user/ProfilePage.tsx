import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Building, Globe, Save, Lock } from 'lucide-react';
import { authApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { User as UserType } from '../../types';

export default function ProfilePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const { register, handleSubmit } = useForm<Partial<UserType>>({
        defaultValues: {
            fullNameEn: user?.fullNameEn,
            fullNameAr: user?.fullNameAr,
            institution: user?.institution,
            preferredLanguage: user?.preferredLanguage,
        },
    });

    const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword } = useForm<{
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }>();

    const onSubmit = async (data: Partial<UserType>) => {
        setIsLoading(true);
        try {
            const updated = await authApi.updateProfile(data);
            updateUser(updated);
            toast.success(t('common.success'));
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsLoading(false);
        }
    };

    const onChangePassword = async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
        if (data.newPassword !== data.confirmPassword) {
            toast.error('Passwords do not match | كلمات المرور غير متطابقة');
            return;
        }
        setIsChangingPassword(true);
        try {
            await authApi.changePassword(data.currentPassword, data.newPassword);
            toast.success('Password changed | تم تغيير كلمة المرور');
            resetPassword();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-secondary-100 dark:bg-secondary-900 py-8 px-4">
            <div className="max-w-2xl mx-auto animate-fade-in">
                <button onClick={() => navigate(-1)} className="btn-ghost mb-4">
                    <ArrowLeft className="w-4 h-4 me-2" />
                    {t('common.back')}
                </button>

                {/* Profile Header */}
                <div className="card mb-6 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                        <User className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-secondary-800 dark:text-white">
                        {i18n.language === 'ar' ? user?.fullNameAr : user?.fullNameEn}
                    </h1>
                    <p className="text-secondary-600 dark:text-secondary-400">{user?.email}</p>
                    <div className="flex justify-center gap-2 mt-3">
                        {user?.roles?.map(role => (
                            <span key={role} className="badge badge-primary">{role}</span>
                        ))}
                    </div>
                </div>

                {/* Profile Form */}
                <div className="card mb-6">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                        {t('profile.editProfile')}
                    </h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('auth.register.fullNameEn')}</label>
                                <div className="relative">
                                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        {...register('fullNameEn', { required: true })}
                                        className="input ps-10"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('auth.register.fullNameAr')}</label>
                                <div className="relative">
                                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        {...register('fullNameAr', { required: true })}
                                        className="input ps-10"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('auth.register.email')}</label>
                            <div className="relative">
                                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input value={user?.email} className="input ps-10 bg-secondary-50" disabled dir="ltr" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('auth.register.institution')}</label>
                            <div className="relative">
                                <Building className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input {...register('institution')} className="input ps-10" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('auth.register.preferredLanguage')}</label>
                            <div className="relative">
                                <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <select {...register('preferredLanguage')} className="input ps-10">
                                    <option value="en">English</option>
                                    <option value="ar">العربية</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full">
                            <Save className="w-4 h-4 me-2" />
                            {isLoading ? t('common.loading') : t('profile.saveChanges')}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                        {t('profile.changePassword')}
                    </h2>
                    <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">{t('profile.currentPassword')}</label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="password"
                                    {...registerPassword('currentPassword', { required: true })}
                                    className="input ps-10"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('profile.newPassword')}</label>
                                <input
                                    type="password"
                                    {...registerPassword('newPassword', { required: true, minLength: 8 })}
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">{t('profile.confirmNewPassword')}</label>
                                <input
                                    type="password"
                                    {...registerPassword('confirmPassword', { required: true })}
                                    className="input"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={isChangingPassword} className="btn-secondary">
                            <Lock className="w-4 h-4 me-2" />
                            {isChangingPassword ? t('common.loading') : t('profile.changePassword')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
