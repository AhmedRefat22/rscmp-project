import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    MessageSquare,
    Search,
    Mail,
    User,
    CheckCircle,
    Clock,
    Reply
} from 'lucide-react';
import { adminApi } from '../../api/services';

export default function AdminMessagesPage() {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const result = await adminApi.getContactMessages({ page, pageSize: 10 });
            setMessages(result.items || []);
            setTotalPages(result.totalPages || 1);
        } catch {
            toast.error(t('errors.serverError'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [page, t]);

    const handleReply = async (id: string) => {
        if (!replyText.trim()) return;
        try {
            await adminApi.replyToMessage(id, replyText);
            toast.success(t('common.success', 'Reply sent successfully'));
            setReplyingTo(null);
            setReplyText('');
            fetchMessages(); // Refresh to update status
        } catch {
            toast.error(t('errors.serverError'));
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                    {t('admin.messages', 'Contact Messages')}
                </h1>
                <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                    {t('admin.messagesDesc', 'View and reply to user inquiries')}
                </p>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((msg) => (
                        <div key={msg.id} className="card p-6 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`badge ${msg.status === 'Replied' ? 'badge-success' : 'badge-warning'}`}>
                                            {msg.status || 'Pending'}
                                        </span>
                                        <span className="text-xs text-secondary-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-1">
                                        {msg.subject}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {msg.name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {msg.email}
                                        </span>
                                    </div>
                                    <p className="text-secondary-700 dark:text-secondary-300 bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
                                        {msg.message}
                                    </p>

                                    {/* Reply Section */}
                                    {replyingTo === msg.id ? (
                                        <div className="mt-4 animate-fade-in">
                                            <textarea
                                                className="input mb-2"
                                                rows={3}
                                                placeholder={t('common.placeholder', 'Type your reply...')}
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    className="btn-ghost btn-sm"
                                                >
                                                    {t('common.cancel')}
                                                </button>
                                                <button
                                                    onClick={() => handleReply(msg.id)}
                                                    className="btn-primary btn-sm"
                                                    disabled={!replyText.trim()}
                                                >
                                                    <Reply className="w-4 h-4 me-1" />
                                                    {t('common.send')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : msg.status !== 'Replied' && (
                                        <button
                                            onClick={() => setReplyingTo(msg.id)}
                                            className="btn-secondary btn-sm mt-4"
                                        >
                                            <Reply className="w-4 h-4 me-1" />
                                            {t('common.reply', 'Reply')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="card p-12 text-center">
                        <MessageSquare className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
                        <h3 className="text-lg font-medium text-secondary-800 dark:text-white mb-2">
                            {t('common.noData')}
                        </h3>
                        <p className="text-secondary-600 dark:text-secondary-400">
                            {t('admin.noMessages', 'No messages found')}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="btn-secondary btn-sm"
                        >
                            {t('common.previous')}
                        </button>
                        <span className="flex items-center px-4 text-sm font-medium">
                            {page} / {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="btn-secondary btn-sm"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
