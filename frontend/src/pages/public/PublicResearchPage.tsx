import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Search, Calendar, User, Filter } from 'lucide-react';
import { researchApi, conferencesApi } from '../../api/services';
import { Research, Conference } from '../../types';
import { handleApiError } from '../../utils/errorHandler';

export default function PublicResearchPage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const [researches, setResearches] = useState<Research[]>([]);
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConference, setSelectedConference] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('search');
        if (query) {
            setSearch(query);
        }
    }, [location.search]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [researchData, conferenceData] = await Promise.all([
                    researchApi.getPublic(selectedConference || undefined),
                    conferencesApi.getAll(),
                ]);
                setResearches(researchData || []);
                setConferences(conferenceData || []);
            } catch (error) {
                handleApiError(error);
                setResearches([]);
                setConferences([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedConference, t]);

    const filteredResearches = researches.filter(r => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            r.titleEn?.toLowerCase().includes(searchLower) ||
            r.titleAr?.includes(search)
        );
    });

    return (
        <div className="py-16 px-4 animate-fade-in">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white mb-4">
                        {t('research.publicResearch')}
                    </h1>
                    <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
                        {i18n.language === 'ar'
                            ? 'استعرض الأبحاث المعتمدة والمنشورة من مؤتمراتنا'
                            : 'Browse approved and published research from our conferences'}
                    </p>
                </div>

                {/* Filters */}
                <div className="card mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={i18n.language === 'ar' ? 'بحث بالعنوان...' : 'Search by title...'}
                                className="input ps-10"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                            <select
                                value={selectedConference}
                                onChange={(e) => setSelectedConference(e.target.value)}
                                className="input ps-10 w-full md:w-64"
                            >
                                <option value="">{i18n.language === 'ar' ? 'جميع المؤتمرات' : 'All Conferences'}</option>
                                {conferences.map(conf => (
                                    <option key={conf.id} value={conf.id}>
                                        {i18n.language === 'ar' ? conf.nameAr : conf.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : filteredResearches.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredResearches.map((research) => (
                            <Link to={`/research/${research.id}`} key={research.id} className="card hover:shadow-lg transition-shadow block cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-1">
                                            {i18n.language === 'ar' ? research.titleAr : research.titleEn}
                                        </h3>
                                        <p className="text-sm text-secondary-600 dark:text-secondary-400 line-clamp-2 mb-3">
                                            {i18n.language === 'ar' ? research.abstractAr : research.abstractEn}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary-500">
                                            {research.authors && research.authors.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {research.authors.map(a => i18n.language === 'ar' ? a.fullNameAr : a.fullNameEn).join(', ')}
                                                </span>
                                            )}
                                            <span className="badge badge-success">{research.conferenceName}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-16">
                        <Filter className="w-16 h-16 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
                        <h3 className="text-lg font-medium text-secondary-800 dark:text-white mb-2">
                            {i18n.language === 'ar' ? 'لا توجد نتائج' : 'No Results Found'}
                        </h3>
                        <p className="text-secondary-600 dark:text-secondary-400">
                            {i18n.language === 'ar' ? 'جرب تغيير معايير البحث' : 'Try adjusting your search criteria'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
