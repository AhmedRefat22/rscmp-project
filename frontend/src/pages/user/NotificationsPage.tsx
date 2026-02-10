import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { notificationsApi } from '../../api/services';
import { Notification } from '../../types';
import { useNotificationStore } from '../../store/authStore';

export default function NotificationsPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setUnreadCount, clearUnreadCount } = useNotificationStore();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationsApi.getAll();
                setNotifications(data);
            } catch {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotifications();
    }, [t]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(notifications.filter(n => !n.isRead && n.id !== id).length);
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            clearUnreadCount();
            toast.success(i18n.language === 'ar' ? 'تم تحديد الكل كمقروء' : 'All marked as read');
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const unreadNotifications = notifications.filter(n => !n.isRead);

    return (
        <div className="min-h-screen bg-secondary-100 dark:bg-secondary-900 py-8 px-4">
            <div className="max-w-2xl mx-auto animate-fade-in">
                <button onClick={() => navigate(-1)} className="btn-ghost mb-4">
                    <ArrowLeft className="w-4 h-4 me-2" />
                    {t('common.back')}
                </button>

                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Bell className="w-6 h-6 text-primary-600" />
                            <h1 className="text-xl font-bold text-secondary-800 dark:text-white">
                                {t('notifications.title')}
                            </h1>
                            {unreadNotifications.length > 0 && (
                                <span className="badge badge-primary">{unreadNotifications.length}</span>
                            )}
                        </div>
                        {unreadNotifications.length > 0 && (
                            <button onClick={handleMarkAllAsRead} className="btn-ghost text-sm">
                                <CheckCheck className="w-4 h-4 me-1" />
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 rounded-lg transition-colors ${notification.isRead
                                            ? 'bg-secondary-50 dark:bg-secondary-700/30'
                                            : 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className={`font-medium ${notification.isRead ? 'text-secondary-700 dark:text-secondary-300' : 'text-primary-700 dark:text-primary-300'}`}>
                                                {i18n.language === 'ar' ? notification.titleAr : notification.titleEn}
                                            </h3>
                                            <p className={`text-sm mt-1 ${notification.isRead ? 'text-secondary-500' : 'text-secondary-600 dark:text-secondary-400'}`}>
                                                {i18n.language === 'ar' ? notification.messageAr : notification.messageEn}
                                            </p>
                                            <p className="text-xs text-secondary-400 mt-2">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {notification.link && (
                                                <Link to={notification.link} className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                            )}
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Bell className="w-16 h-16 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
                            <p className="text-secondary-600 dark:text-secondary-400">{t('notifications.empty')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
