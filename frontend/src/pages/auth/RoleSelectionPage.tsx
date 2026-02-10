import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, UserCheck, Users, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function RoleSelectionPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, setSelectedRole } = useAuthStore();

    const roles = [
        { key: 'Reviewer', icon: UserCheck, color: 'from-blue-500 to-blue-600', path: '/reviewer' },
        { key: 'Chairman', icon: Shield, color: 'from-purple-500 to-purple-600', path: '/chairman' },
        { key: 'Admin', icon: Users, color: 'from-red-500 to-red-600', path: '/admin' },
        { key: 'Public', icon: Globe, color: 'from-green-500 to-green-600', path: '/my-submissions' },
    ];

    const availableRoles = roles.filter(role =>
        user?.roles.includes(role.key) || role.key === 'Public'
    );

    const handleRoleSelect = (role: string, path: string) => {
        setSelectedRole(role);
        navigate(path);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-900 dark:to-secondary-800 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-fade-in">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-secondary-800 dark:text-white mb-2">
                        {t('auth.roleSelection.title')}
                    </h1>
                    <p className="text-secondary-600 dark:text-secondary-400">
                        {t('auth.roleSelection.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableRoles.map((role, index) => {
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.key}
                                onClick={() => handleRoleSelect(role.key, role.path)}
                                className="group card-hover text-start transition-all duration-300 hover:-translate-y-1"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-14 h-14 mb-4 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-1">
                                    {t(`auth.roleSelection.roles.${role.key.toLowerCase()}.title`)}
                                </h3>
                                <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                                    {t(`auth.roleSelection.roles.${role.key.toLowerCase()}.description`)}
                                </p>
                                <div className="mt-4 text-primary-600 dark:text-primary-400 text-sm font-medium group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform inline-flex items-center gap-1">
                                    {t('auth.roleSelection.continue')} {t(`auth.roleSelection.roles.${role.key.toLowerCase()}.title`)}
                                    <span>→</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
