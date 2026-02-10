import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Key, Check } from 'lucide-react';
import { authApi } from '../../api/services';

const emailSchema = z.object({
    email: z.string().email('Invalid email | البريد الإلكتروني غير صالح'),
});

const resetSchema = z.object({
    code: z.string().min(6, 'Code must be 6 digits | الكود يجب أن يكون 6 أرقام').max(6),
    newPassword: z.string().min(6, 'Password must be at least 6 characters | كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match | كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    });

    const resetForm = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    });

    const handleEmailSubmit = async (data: EmailFormData) => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(data.email);
            setEmail(data.email);
            setStep('code');
            toast.success(t('auth.forgotPassword.codeSent') || 'Verification code sent to your email');
        } catch (error: any) {
            // Don't reveal if email exists or not for security
            toast.success(t('auth.forgotPassword.codeSent') || 'If your email is registered, you will receive a verification code');
            setEmail(data.email);
            setStep('code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetSubmit = async (data: ResetFormData) => {
        setIsLoading(true);
        try {
            await authApi.resetPassword(email, data.code, data.newPassword);
            setStep('success');
            toast.success(t('auth.forgotPassword.success') || 'Password reset successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('auth.forgotPassword.invalidCode') || 'Invalid or expired code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            toast.success(t('auth.forgotPassword.codeSent') || 'New code sent to your email');
        } catch (error) {
            toast.error(t('errors.generic') || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-8 px-4 sm:py-12">
            <div className="w-full max-w-md">
                <div className="card animate-slide-up">
                    {/* Header */}
                    <div className="text-center mb-6 sm:mb-8">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                            {step === 'success' ? (
                                <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            ) : step === 'code' ? (
                                <Key className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            ) : (
                                <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            )}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-secondary-800 dark:text-white">
                            {step === 'success'
                                ? (t('auth.forgotPassword.successTitle') || 'Password Reset!')
                                : step === 'code'
                                    ? (t('auth.forgotPassword.enterCode') || 'Enter Verification Code')
                                    : (t('auth.forgotPassword.title') || 'Forgot Password?')}
                        </h1>
                        <p className="text-sm sm:text-base text-secondary-600 dark:text-secondary-400 mt-1 px-2">
                            {step === 'success'
                                ? (t('auth.forgotPassword.successMessage') || 'Your password has been reset successfully.')
                                : step === 'code'
                                    ? (t('auth.forgotPassword.codeMessage') || `We sent a 6-digit code to ${email}`)
                                    : (t('auth.forgotPassword.subtitle') || 'Enter your email and we\'ll send you a verification code.')}
                        </p>
                    </div>

                    {/* Step 1: Email Input */}
                    {step === 'email' && (
                        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.login.email') || 'Email Address'}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    <input
                                        type="email"
                                        {...emailForm.register('email')}
                                        className={`input ps-10 ${emailForm.formState.errors.email ? 'input-error' : ''}`}
                                        placeholder="your@email.com"
                                        dir="ltr"
                                    />
                                </div>
                                {emailForm.formState.errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{emailForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
                            >
                                {isLoading ? (t('common.loading') || 'Loading...') : (t('auth.forgotPassword.sendCode') || 'Send Verification Code')}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Code and New Password */}
                    {step === 'code' && (
                        <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.forgotPassword.verificationCode') || 'Verification Code'}
                                </label>
                                <input
                                    type="text"
                                    {...resetForm.register('code')}
                                    className={`input text-center text-xl sm:text-2xl tracking-widest ${resetForm.formState.errors.code ? 'input-error' : ''}`}
                                    placeholder="000000"
                                    maxLength={6}
                                    dir="ltr"
                                />
                                {resetForm.formState.errors.code && (
                                    <p className="text-red-500 text-sm mt-1">{resetForm.formState.errors.code.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.forgotPassword.newPassword') || 'New Password'}
                                </label>
                                <input
                                    type="password"
                                    {...resetForm.register('newPassword')}
                                    className={`input ${resetForm.formState.errors.newPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                                {resetForm.formState.errors.newPassword && (
                                    <p className="text-red-500 text-sm mt-1">{resetForm.formState.errors.newPassword.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
                                    {t('auth.forgotPassword.confirmPassword') || 'Confirm Password'}
                                </label>
                                <input
                                    type="password"
                                    {...resetForm.register('confirmPassword')}
                                    className={`input ${resetForm.formState.errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="••••••••"
                                    dir="ltr"
                                />
                                {resetForm.formState.errors.confirmPassword && (
                                    <p className="text-red-500 text-sm mt-1">{resetForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
                            >
                                {isLoading ? (t('common.loading') || 'Loading...') : (t('auth.forgotPassword.resetPassword') || 'Reset Password')}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={isLoading}
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    {t('auth.forgotPassword.resendCode') || "Didn't receive the code? Resend"}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Success */}
                    {step === 'success' && (
                        <div className="text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
                            >
                                {t('auth.forgotPassword.goToLogin') || 'Go to Login'}
                            </button>
                        </div>
                    )}

                    {/* Back to Login Link */}
                    {step !== 'success' && (
                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600"
                            >
                                <ArrowLeft className="w-4 h-4 me-1" />
                                {t('auth.forgotPassword.backToLogin') || 'Back to Login'}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
