import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Settings } from 'lucide-react';
import { adminApi } from '../../api/services';

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const [settings, setSettings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await adminApi.getSettings();
                setSettings(data);
            } catch {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [t]);

    const handleUpdateSetting = async (key: string, value: string) => {
        try {
            await adminApi.updateSetting(key, value);
            toast.success('Setting updated | تم تحديث الإعداد');
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

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-secondary-800 dark:text-white mb-6">
                {t('admin.settings')}
            </h1>

            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-6 h-6 text-primary-600" />
                    <h2 className="text-lg font-semibold text-secondary-800 dark:text-white">
                        {i18n.language === 'ar' ? 'إعدادات النظام' : 'System Settings'}
                    </h2>
                </div>

                <div className="space-y-4">
                    {settings.map((setting) => (
                        <div key={setting.key} className="flex items-center gap-4 p-4 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                            <div className="flex-1">
                                <label className="block font-medium text-secondary-800 dark:text-white mb-1">
                                    {setting.key}
                                </label>
                                <p className="text-sm text-secondary-500">{setting.description}</p>
                            </div>
                            <input
                                type="text"
                                defaultValue={setting.value}
                                onBlur={(e) => handleUpdateSetting(setting.key, e.target.value)}
                                className="input w-64"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
