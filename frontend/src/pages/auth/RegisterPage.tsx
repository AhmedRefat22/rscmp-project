import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, Building } from 'lucide-react';
import { authApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import PhoneInput from '../../components/common/PhoneInput';

const registerSchema = z.object({
    email: z.string().email('Invalid email | البريد الإلكتروني غير صالح'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters | كلمة المرور يجب أن تكون 8 أحرف على الأقل')
        .regex(/[A-Z]/, 'Password must contain uppercase letter | يجب أن تحتوي كلمة المرور على حرف كبير')
        .regex(/[a-z]/, 'Password must contain lowercase letter | يجب أن تحتوي كلمة المرور على حرف صغير')
        .regex(/[0-9]/, 'Password must contain a number | يجب أن تحتوي كلمة المرور على رقم')
        .regex(/[^A-Za-z0-9]/, 'Password must contain a special character | يجب أن تحتوي كلمة المرور على رمز خاص'),
    confirmPassword: z.string(),
    fullNameEn: z.string().min(3, 'English name is required | الاسم بالإنجليزية مطلوب'),
    fullNameAr: z.string().min(3, 'Arabic name is required | الاسم بالعربية مطلوب'),
    phoneNumber: z.string().min(10, 'Phone number is required | رقم الهاتف مطلوب').regex(/^[0-9+\-\s]+$/, 'Invalid phone number | رقم الهاتف غير صالح'),
    institution: z.string().optional(),
    preferredLanguage: z.enum(['English', 'Arabic']),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match | كلمات المرور غير متطابقة',
    path: ['confirmPassword'],
});

export default function RegisterPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, control, formState: { errors } } = useForm<any>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            preferredLanguage: i18n.language === 'ar' ? 'Arabic' : 'English',
        },
    });

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            // Backend expects 0 (English) or 1 (Arabic), or "English"/"Arabic" strings with the converter.
            // Backend expects 'en' (English) or 'ar' (Arabic) as per RegisterRequest type.
            // Our form uses "English"/"Arabic".
            const payload = {
                ...data,
                preferredLanguage: data.preferredLanguage === 'English' ? 'en' : 'ar'
            };
            const response = await authApi.register(payload);
            login(response.user, response.accessToken, response.refreshToken);
            toast.success(t('common.success'));
            navigate('/my-submissions');
        } catch (error: any) {
            console.error('Registration error:', error);
            const message = error.response?.data?.message;
            const errors = error.response?.data?.errors;

            if (message) {
                toast.error(message);
            } else if (errors) {
                // Handle validation errors object
                const errorMessages = Object.values(errors).flat().join('\n');
                toast.error(errorMessages || t('errors.serverError'));
            } else {
                toast.error(t('errors.serverError'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-lg">
                <div className="card animate-slide-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                            <UserPlus className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                            {t('auth.register.title')}
                        </h1>
                        <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                            {t('auth.register.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.register.fullNameEn')}
                                </label>
                                <div className="relative">
                                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type="text"
                                        {...register('fullNameEn')}
                                        className={`input ps-10 ${errors.fullNameEn ? 'input-error' : ''}`}
                                        placeholder="John Doe"
                                        dir="ltr"
                                    />
                                </div>
                                {!!errors.fullNameEn && (
                                    <p className="text-red-500 text-sm mt-1">{errors.fullNameEn.message as string}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.register.fullNameAr')}
                                </label>
                                <div className="relative">
                                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type="text"
                                        {...register('fullNameAr')}
                                        className={`input ps-10 ${errors.fullNameAr ? 'input-error' : ''}`}
                                        placeholder="أحمد محمد"
                                        dir="rtl"
                                    />
                                </div>
                                {!!errors.fullNameAr && (
                                    <p className="text-red-500 text-sm mt-1">{errors.fullNameAr.message as string}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                {t('auth.register.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="email"
                                    {...register('email')}
                                    className={`input ps-10 ${errors.email ? 'input-error' : ''}`}
                                    placeholder="your@email.com"
                                    dir="ltr"
                                />
                            </div>
                            {!!errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                {t('auth.register.phoneNumber')}
                            </label>
                            <div className="relative">
                                {/* Phone Icon removed or handled inside PhoneInput? PhoneInput doesn't have icon prop but has placeholder for it? 
                                    My PhoneInput implementation has a vertical separator. I should probably not wrap it in relative div with icon 
                                    OR pass icon to it?
                                    The previous design had a Phone icon. My component doesn't take an icon.
                                    I'll just use the component. It looks like a select+input.
                                */}
                                <Controller
                                    name="phoneNumber"
                                    control={control}
                                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                                        <PhoneInput
                                            value={value}
                                            onChange={onChange}
                                            error={error?.message}
                                            placeholder="+20 123 456 7890"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                {t('auth.register.institution')}
                            </label>
                            <div className="relative">
                                <Building className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                <input
                                    type="text"
                                    {...register('institution')}
                                    className="input ps-10"
                                    placeholder="University / Organization"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.register.password')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        className={`input ps-10 pe-10 ${errors.password ? 'input-error' : ''}`}
                                        placeholder="••••••••"
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute end-3 top-1/2 -translate-y-1/2 text-secondary-400"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {!!errors.password && (
                                    <p className="text-red-500 text-sm mt-1">{errors.password.message as string}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.register.confirmPassword')}
                                </label>
                                <div className="relative">
                                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type="password"
                                        {...register('confirmPassword')}
                                        className={`input ps-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                        placeholder="••••••••"
                                        dir="ltr"
                                    />
                                </div>
                                {!!errors.confirmPassword && (
                                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message as string}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                {t('auth.register.preferredLanguage')}
                            </label>
                            <select {...register('preferredLanguage')} className="input">
                                <option value="English">English</option>
                                <option value="Arabic">العربية</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 text-base mt-6"
                        >
                            {isLoading ? t('common.loading') : t('auth.register.submit')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-secondary-600 dark:text-secondary-400">
                            {t('auth.register.hasAccount')}{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                {t('auth.register.login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
