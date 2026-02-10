import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { authApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { LoginRequest } from '../../types';

const loginSchema = z.object({
    email: z.string().email('Invalid email | البريد الإلكتروني غير صالح'),
    password: z.string().min(1, 'Password is required | كلمة المرور مطلوبة'),
});

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginRequest) => {
        setIsLoading(true);
        try {
            const response = await authApi.login(data);
            login(response.user, response.accessToken, response.refreshToken);
            toast.success(t('common.success'));

            // Check for intended role from RoleLoginSelector
            const intendedRole = sessionStorage.getItem('intendedRole');
            sessionStorage.removeItem('intendedRole');

            const roleMap: Record<string, string> = {
                'researcher': 'Public',
                'reviewer': 'Reviewer',
                'chairman': 'Chairman',
                'admin': 'Admin'
            };

            let targetRole = null;
            if (intendedRole && roleMap[intendedRole]) {
                const backendRole = roleMap[intendedRole];
                if (response.user.roles.includes(backendRole)) {
                    targetRole = backendRole;
                }
            }

            if (targetRole) {
                useAuthStore.getState().setSelectedRole(targetRole);
                navigate(targetRole === 'Admin' ? '/admin' : targetRole === 'Chairman' ? '/chairman' : targetRole === 'Reviewer' ? '/reviewer' : '/my-submissions');
            } else if (response.user.roles && response.user.roles.length > 1) {
                navigate('/role-selection', { state: { user: response.user, tokens: { accessToken: response.accessToken, refreshToken: response.refreshToken } } });
            } else {
                const role = response.user.roles[0] || 'Public';
                useAuthStore.getState().setSelectedRole(role);
                navigate(role === 'Admin' ? '/admin' : role === 'Chairman' ? '/chairman' : role === 'Reviewer' ? '/reviewer' : '/my-submissions');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const message = error.response?.data?.message;
            if (message) {
                toast.error(message);
            } else {
                toast.error(t('errors.invalidCredentials'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="card animate-slide-up">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                            <LogIn className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                            {t('auth.login.title')}
                        </h1>
                        <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                            {t('auth.login.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                {t('auth.login.email')}
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
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                {t('auth.login.password')}
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
                                    className="absolute end-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded text-primary-600" />
                                <span className="text-sm text-secondary-600 dark:text-secondary-400">
                                    {t('auth.login.rememberMe')}
                                </span>
                            </label>
                            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                                {t('auth.login.forgotPassword')}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3 text-base"
                        >
                            {isLoading ? t('common.loading') : t('auth.login.submit')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-secondary-600 dark:text-secondary-400">
                            {t('auth.login.noAccount')}{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                                {t('auth.login.register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
