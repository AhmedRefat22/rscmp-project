import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, Phone, Building, Shield, Trash2, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/services';
import { User as UserType } from '../../types';

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // We might not have an update user endpoint for admin (usually admin updates roles, user updates profile)
    // checking services.ts -> adminApi has assignRole, removeRole, deleteUser. 
    // It doesn't seem to have "updateUser" profile info. 
    // However, usually admins can edit users. 
    // If not available, we will just make it a "View Details + Manage Roles" page.
    // For now, let's assume read-only profile + role management.

    useEffect(() => {
        const fetchUser = async () => {
            if (!id) return;
            try {
                const data = await adminApi.getUser(id);
                setUser(data);
            } catch {
                toast.error(t('errors.notFound'));
                navigate('/admin/users');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [id, navigate, t]);

    const handleAssignRole = async (role: string) => {
        if (!id || !user) return;
        try {
            await adminApi.assignRole(id, role);
            toast.success('Role assigned | تم تعيين الدور');
            // Refresh user
            const updated = await adminApi.getUser(id);
            setUser(updated);
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    const handleRemoveRole = async (role: string) => {
        if (!id || !user) return;
        try {
            await adminApi.removeRole(id, role);
            toast.success('Role removed | تم إزالة الدور');
            const updated = await adminApi.getUser(id);
            setUser(updated);
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    const handleDeleteUser = async () => {
        if (!id || !confirm('Are you sure you want to delete this user? | هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await adminApi.deleteUser(id);
            toast.success('User deleted | تم حذف المستخدم');
            navigate('/admin/users');
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!user) return null;

    const roles = ['Admin', 'Chairman', 'Reviewer'];

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <button onClick={() => navigate('/admin/users')} className="btn-ghost mb-6">
                <ArrowLeft className="w-4 h-4 me-2" />
                {t('common.back')}
            </button>

            {/* Header */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-center md:text-start flex-1">
                        <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-2">
                            {i18n.language === 'ar' ? user.fullNameAr : user.fullNameEn}
                        </h1>
                        <p className="text-secondary-600 dark:text-secondary-400 mb-4">{user.email}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {user.roles?.map(role => (
                                <span key={role} className="badge badge-primary flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleDeleteUser} className="btn-danger md:self-start">
                        <Trash2 className="w-4 h-4 me-2" />
                        {i18n.language === 'ar' ? 'حذف المستخدم' : 'Delete User'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Info */}
                <div className="card h-fit">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                        {t('common.details')}
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-secondary-400" />
                            <div>
                                <p className="text-sm text-secondary-500">{t('auth.register.fullNameEn')}</p>
                                <p className="font-medium text-secondary-800 dark:text-white">{user.fullNameEn}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-secondary-400" />
                            <div>
                                <p className="text-sm text-secondary-500">{t('auth.register.fullNameAr')}</p>
                                <p className="font-medium text-secondary-800 dark:text-white">{user.fullNameAr}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-secondary-400" />
                            <div>
                                <p className="text-sm text-secondary-500">{t('auth.register.email')}</p>
                                <p className="font-medium text-secondary-800 dark:text-white">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-secondary-400" />
                            <div>
                                <p className="text-sm text-secondary-500">{i18n.language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</p>
                                <p className="font-medium text-secondary-800 dark:text-white" dir="ltr">{user.phoneNumber || '-'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building className="w-5 h-5 text-secondary-400" />
                            <div>
                                <p className="text-sm text-secondary-500">{t('auth.register.institution')}</p>
                                <p className="font-medium text-secondary-800 dark:text-white">{user.institution || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Role Management */}
                <div className="card h-fit">
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">
                        {i18n.language === 'ar' ? 'إدارة الأدوار' : 'Role Management'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-secondary-700 dark:text-secondary-300">
                                {i18n.language === 'ar' ? 'الأدوار الحالية' : 'Current Roles'}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {user.roles?.map(role => (
                                    <div key={role} className="badge badge-secondary py-1 ps-3 pe-1 flex items-center gap-2">
                                        {role}
                                        <button
                                            onClick={() => handleRemoveRole(role)}
                                            className="hover:bg-red-100 dark:hover:bg-red-900 rounded-full p-0.5 text-secondary-500 hover:text-red-600 transition-colors"
                                            title="Remove Role"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-secondary-700 dark:text-secondary-300">
                                {i18n.language === 'ar' ? 'إضافة دور' : 'Add Role'}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="input flex-1"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleAssignRole(e.target.value);
                                            e.target.value = "";
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>{i18n.language === 'ar' ? 'اختر دور لإضافته...' : 'Select role to add...'}</option>
                                    {roles.filter(r => !user.roles?.includes(r)).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-800 dark:text-blue-200">
                            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <p>
                                {i18n.language === 'ar'
                                    ? 'تغيير الأدوار سيؤثر فوراً على صلاحيات المستخدم.'
                                    : 'Changing roles will immediately affect user permissions.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
