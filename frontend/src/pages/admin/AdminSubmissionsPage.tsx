import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    FileText,
    Search,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle
} from 'lucide-react';
import { researchApi, conferencesApi } from '../../api/services';
import { Research, Conference } from '../../types';

export default function AdminSubmissionsPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [researches, setResearches] = useState<Research[]>([]);
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterConference, setFilterConference] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchConferences = async () => {
            try {
                const data = await conferencesApi.getAll();
                setConferences(data);
            } catch (error) {
                console.error('Failed to fetch conferences', error);
            }
        };
        fetchConferences();
    }, []);

    useEffect(() => {
        const fetchResearches = async () => {
            setIsLoading(true);
            try {
                const result = await researchApi.getAll({
                    page,
                    pageSize: 10,
                    conferenceId: filterConference || undefined,
                    status: filterStatus || undefined,
                });
                setResearches(result.items);
                setTotalPages(result.totalPages);
            } catch {
                toast.error(t('errors.serverError'));
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchResearches, 300);
        return () => clearTimeout(debounce);
    }, [page, filterConference, filterStatus, t]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Approved':
                return <span className="badge badge-success flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {status}</span>;
            case 'Rejected':
                return <span className="badge badge-error flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
            case 'Pending':
                return <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
            default:
                return <span className="badge badge-secondary flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {status}</span>;
        }
    };

    const filteredResearches = researches.filter(r =>
        r.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.titleAr.includes(searchTerm)
    );

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">
                        {t('admin.submissions', 'Research Submissions')}
                    </h1>
                    <p className="text-secondary-600 dark:text-secondary-400 mt-1">
                        {t('admin.submissionsDesc', 'Manage and view all research submissions')}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                        <input
                            type="text"
                            placeholder={t('common.search', 'Search by title...')}
                            className="input ps-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            className="input"
                            value={filterConference}
                            onChange={(e) => { setFilterConference(e.target.value); setPage(1); }}
                        >
                            <option value="">{t('common.allConferences', 'All Conferences')}</option>
                            {conferences.map(c => (
                                <option key={c.id} value={c.id}>
                                    {i18n.language === 'ar' ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full md:w-48">
                        <select
                            className="input"
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        >
                            <option value="">{t('common.allStatuses', 'All Statuses')}</option>
                            <option value="Pending">Pending</option>
                            <option value="UnderReview">Under Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
                    </div>
                ) : filteredResearches.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th className="text-start">{t('research.title')}</th>
                                    <th className="text-start">{t('research.conference')}</th>
                                    <th className="text-start">{t('research.submissionDate')}</th>
                                    <th className="text-start">{t('common.status')}</th>
                                    <th className="text-start">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResearches.map((research) => (
                                    <tr
                                        key={research.id}
                                        className="hover:bg-secondary-50 dark:hover:bg-secondary-700/30 cursor-pointer transition-colors"
                                        onClick={() => navigate(`/admin/submissions/${research.id}`)}
                                    >
                                        <td className="font-medium">
                                            <div className="max-w-md truncate">
                                                {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                                            </div>
                                        </td>
                                        <td>{research.conferenceName}</td>
                                        <td>{new Date(research.submittedAt || Date.now()).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(research.status)}</td>
                                        <td>
                                            <Link
                                                to={`/admin/submissions/${research.id}`}
                                                className="btn-ghost btn-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Eye className="w-4 h-4 me-1" />
                                                {t('common.view')}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto text-secondary-300 mb-4" />
                        <h3 className="text-lg font-medium text-secondary-800 dark:text-white mb-2">
                            {t('common.noData')}
                        </h3>
                        <p className="text-secondary-600 dark:text-secondary-400">
                            {t('research.noResearchesFound')}
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-secondary-100 dark:border-secondary-700 flex justify-center gap-2">
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
