import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Search, Trash2, UserPlus, X, Users, Shield, Crown } from 'lucide-react';
import { adminApi } from '../../api/services';
import { User, PagedResult, CreateUserByAdminRequest } from '../../types';

type RoleTab = 'all' | 'Public' | 'Reviewer' | 'Chairman' | 'Admin';

export default function UsersPage() {
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState<PagedResult<User>>({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<RoleTab>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserByAdminRequest>({
        defaultValues: {
            role: 'Reviewer',
            preferredLanguage: 'en',
        },
    });

    const fetchUsers = async (page = 1) => {
        setIsLoading(true);
        try {
            const data = await adminApi.getUsers({
                page,
                pageSize: 10,
                role: activeTab === 'all' ? undefined : activeTab
            });
            setUsers(data);
        } catch {
            toast.error(t('errors.serverError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const handleCreateUser = async (data: CreateUserByAdminRequest) => {
        setIsCreating(true);
        try {
            await adminApi.createUser(data);
            toast.success(i18n.language === 'ar' ? 'تم إنشاء المستخدم بنجاح' : 'User created successfully');
            setShowCreateModal(false);
            reset();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || t('errors.serverError'));
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure? | هل أنت متأكد؟')) return;
        try {
            await adminApi.deleteUser(userId);
            toast.success('User deleted | تم حذف المستخدم');
            fetchUsers(users.pageNumber);
        } catch {
            toast.error(t('errors.serverError'));
        }
    };


    const tabs: { key: RoleTab; label: string; labelAr: string; icon: React.ReactNode }[] = [
        { key: 'all', label: 'All Users', labelAr: 'جميع المستخدمين', icon: <Users className="w-4 h-4" /> },
        { key: 'Public', label: 'Researchers', labelAr: 'الباحثين', icon: <Users className="w-4 h-4" /> },
        { key: 'Reviewer', label: 'Reviewers', labelAr: 'المراجعين', icon: <Shield className="w-4 h-4" /> },
        { key: 'Chairman', label: 'Chairmen', labelAr: 'رؤساء اللجان', icon: <Crown className="w-4 h-4" /> },
        { key: 'Admin', label: 'Admins', labelAr: 'مدراء النظام', icon: <Shield className="w-4 h-4" /> },
    ];

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                    {t('admin.users')}
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    {i18n.language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab.key
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                            }`}
                    >
                        {tab.icon}
                        {i18n.language === 'ar' ? tab.labelAr : tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={i18n.language === 'ar' ? 'بحث...' : 'Search...'}
                        className="input ps-10"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-secondary-50 dark:bg-secondary-700/50">
                            <tr>
                                <th className="px-4 py-3 text-start text-sm font-medium text-secondary-600 dark:text-secondary-400">{t('auth.register.fullNameEn')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-secondary-600 dark:text-secondary-400">{t('auth.register.email')}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-secondary-600 dark:text-secondary-400">{i18n.language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-secondary-600 dark:text-secondary-400">{i18n.language === 'ar' ? 'الأدوار' : 'Roles'}</th>
                                <th className="px-4 py-3 text-start text-sm font-medium text-secondary-600 dark:text-secondary-400">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                                    </td>
                                </tr>
                            ) : users.items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-secondary-500">{t('common.noData')}</td>
                                </tr>
                            ) : (
                                users.items.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-secondary-50 dark:hover:bg-secondary-700/30 cursor-pointer transition-colors"
                                        onClick={(e) => {
                                            // Prevent navigation if clicking on action buttons
                                            if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('select')) return;
                                            window.location.href = `/admin/users/${user.id}`;
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-secondary-800 dark:text-white">{i18n.language === 'ar' ? user.fullNameAr : user.fullNameEn}</p>
                                                <p className="text-xs text-secondary-500">{user.institution}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-secondary-600 dark:text-secondary-400">{user.email}</td>
                                        <td className="px-4 py-3 text-secondary-600 dark:text-secondary-400" dir="ltr">{user.phoneNumber || '-'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.map(role => (
                                                    <span key={role} className="badge badge-primary text-xs">
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {/* Actions can be done in detail page now, but keeping quick delete here is fine */}
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteUser(user.id); }} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-secondary-200 dark:border-secondary-700">
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            {i18n.language === 'ar' ? `صفحة ${users.pageNumber} من ${users.totalPages}` : `Page ${users.pageNumber} of ${users.totalPages}`}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchUsers(users.pageNumber - 1)}
                                disabled={users.pageNumber <= 1}
                                className="btn-secondary text-sm disabled:opacity-50"
                            >
                                {t('common.previous')}
                            </button>
                            <button
                                onClick={() => fetchUsers(users.pageNumber + 1)}
                                disabled={users.pageNumber >= users.totalPages}
                                className="btn-secondary text-sm disabled:opacity-50"
                            >
                                {t('common.next')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-secondary-800 rounded-2xl w-full max-w-lg shadow-xl animate-slide-up">
                        <div className="flex items-center justify-between p-6 border-b border-secondary-200 dark:border-secondary-700">
                            <h2 className="text-xl font-bold text-secondary-800 dark:text-white">
                                {i18n.language === 'ar' ? 'إضافة مستخدم جديد' : 'Add New User'}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(handleCreateUser)} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'الاسم بالإنجليزية' : 'Full Name (EN)'}</label>
                                    <input {...register('fullNameEn', { required: true })} className={`input ${errors.fullNameEn ? 'input-error' : ''}`} dir="ltr" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'الاسم بالعربية' : 'Full Name (AR)'}</label>
                                    <input {...register('fullNameAr', { required: true })} className={`input ${errors.fullNameAr ? 'input-error' : ''}`} dir="rtl" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                                <input type="email" {...register('email', { required: true })} className={`input ${errors.email ? 'input-error' : ''}`} dir="ltr" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                                <input type="tel" {...register('phoneNumber', { required: true })} className={`input ${errors.phoneNumber ? 'input-error' : ''}`} dir="ltr" placeholder="+20 123 456 7890" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                                <input type="password" {...register('password', { required: true, minLength: 8 })} className={`input ${errors.password ? 'input-error' : ''}`} dir="ltr" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'المؤسسة' : 'Institution'}</label>
                                <input {...register('institution')} className="input" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'الدور' : 'Role'}</label>
                                    <select {...register('role')} className="input">
                                        <option value="Reviewer">{i18n.language === 'ar' ? 'مراجع' : 'Reviewer'}</option>
                                        <option value="Chairman">{i18n.language === 'ar' ? 'رئيس لجنة' : 'Chairman'}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{i18n.language === 'ar' ? 'اللغة المفضلة' : 'Language'}</label>
                                    <select {...register('preferredLanguage')} className="input">
                                        <option value="en">English</option>
                                        <option value="ar">العربية</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={isCreating} className="btn-primary flex-1">
                                    {isCreating ? t('common.loading') : (i18n.language === 'ar' ? 'إنشاء المستخدم' : 'Create User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
