import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Users, UserCheck, Shield, ArrowRight } from 'lucide-react';

interface RoleOption {
    id: string;
    icon: React.ReactNode;
    titleKey: string;
    descriptionKey: string;
    color: string;
    bgColor: string;
}

const roleOptions: RoleOption[] = [
    {
        id: 'researcher',
        icon: <User className="w-8 h-8" />,
        titleKey: 'roleSelector.researcher.title',
        descriptionKey: 'roleSelector.researcher.description',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
    },
    {
        id: 'reviewer',
        icon: <UserCheck className="w-8 h-8" />,
        titleKey: 'roleSelector.reviewer.title',
        descriptionKey: 'roleSelector.reviewer.description',
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
    },
    {
        id: 'chairman',
        icon: <Users className="w-8 h-8" />,
        titleKey: 'roleSelector.chairman.title',
        descriptionKey: 'roleSelector.chairman.description',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
    },
    {
        id: 'admin',
        icon: <Shield className="w-8 h-8" />,
        titleKey: 'roleSelector.admin.title',
        descriptionKey: 'roleSelector.admin.description',
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
    }
];

export default function RoleLoginSelector() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleRoleSelect = (roleId: string) => {
        // Store the intended role and navigate to login
        sessionStorage.setItem('intendedRole', roleId);
        navigate('/login');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-secondary-800 dark:text-white mb-3">
                        {t('roleSelector.title')}
                    </h1>
                    <p className="text-secondary-600 dark:text-secondary-400">
                        {t('roleSelector.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roleOptions.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => handleRoleSelect(role.id)}
                            className={`${role.bgColor} p-6 rounded-xl border-2 border-transparent hover:border-primary-300 transition-all duration-300 group text-start`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`${role.color} p-3 rounded-lg bg-white dark:bg-secondary-800 shadow-sm`}>
                                    {role.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-1 flex items-center gap-2">
                                        {t(role.titleKey)}
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </h3>
                                    <p className="text-sm text-secondary-600 dark:text-secondary-400">
                                        {t(role.descriptionKey)}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-secondary-500 dark:text-secondary-400 text-sm">
                        {t('roleSelector.newUser')}{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            {t('roleSelector.createAccount')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
