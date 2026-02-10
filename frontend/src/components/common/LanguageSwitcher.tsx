import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-100 dark:text-secondary-400 dark:hover:bg-secondary-800 transition-colors"
        >
            <Globe className="w-4 h-4" />
            <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
    );
}
