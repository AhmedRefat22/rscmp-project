import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, UserCheck, CheckCircle, Globe, Shield, Zap, Users, Calendar, MapPin } from 'lucide-react';
import Logo from '../components/Logo';
import { conferencesApi } from '../api/services';
import { Conference } from '../types';

export default function LandingPage() {
    const { t, i18n } = useTranslation();
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [isLoadingConferences, setIsLoadingConferences] = useState(true);

    useEffect(() => {
        const fetchConferences = async () => {
            try {
                const data = await conferencesApi.getAll(true); // activeOnly = true
                setConferences(data.slice(0, 3)); // Show max 3 conferences
            } catch (error) {
                console.error('Failed to load conferences:', error);
            } finally {
                setIsLoadingConferences(false);
            }
        };
        fetchConferences();
    }, []);
    const features = [
        { icon: FileText, key: 'submission' },
        { icon: UserCheck, key: 'review' },
        { icon: CheckCircle, key: 'decision' },
        { icon: Globe, key: 'publish' },
    ];

    const quotes = ['quote1', 'quote2', 'quote3'];

    return (
        <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-24 lg:py-32">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-50"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex justify-center mb-8 animate-slide-up">
                        <Logo size="lg" showText={true} className="scale-125" />
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up">
                        {t('landing.hero.title')}
                    </h1>
                    <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-3xl mx-auto">
                        {t('landing.hero.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 text-lg">
                            {t('landing.hero.cta.register')}
                            <ArrowRight className="w-5 h-5 ms-2" />
                        </Link>
                        <Link to="/choose-role" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg">
                            {t('landing.hero.cta.login')}
                        </Link>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-20 -start-20 w-64 h-64 bg-primary-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -top-20 -end-20 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl"></div>
            </section>

            {/* Stats Section */}
            <section className="relative -mt-16 z-10 max-w-5xl mx-auto px-4">
                <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { value: '50+', label: t('landing.stats.conferences') },
                        { value: '2,500+', label: t('landing.stats.submissions') },
                        { value: '1,000+', label: t('landing.stats.researchers') },
                        { value: '45+', label: t('landing.stats.countries') },
                    ].map((stat, index) => (
                        <div key={index} className="text-center">
                            <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                            <div className="text-secondary-600 dark:text-secondary-400 text-sm">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white mb-4">
                        {t('landing.about.title')}
                    </h2>
                    <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
                        {t('landing.about.description')}
                    </p>
                </div>


                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.key}
                                className="group card-hover text-center"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-secondary-800 dark:text-white mb-2">
                                    {t(`landing.about.features.${feature.key}.title`)}
                                </h3>
                                <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                                    {t(`landing.about.features.${feature.key}.description`)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Quotes Section */}
            <section className="py-20 bg-secondary-100 dark:bg-secondary-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-secondary-800 dark:text-white mb-12">
                        {t('landing.quotes.title')}
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {quotes.map((quote) => (
                            <div
                                key={quote}
                                className="bg-white dark:bg-secondary-800 rounded-xl p-6 shadow-lg relative"
                            >
                                <div className="absolute -top-4 start-6 text-6xl text-primary-200 dark:text-primary-800 font-serif">"</div>
                                <p className="text-secondary-700 dark:text-secondary-300 italic mb-4 relative z-10">
                                    {t(`landing.quotes.${quote}.text`)}
                                </p>
                                <p className="text-primary-600 dark:text-primary-400 font-medium">
                                    — {t(`landing.quotes.${quote}.author`)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-8 md:p-12 lg:p-16 text-center text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                    <div className="relative">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            {i18n.language === 'ar' ? 'ابدأ رحلتك البحثية اليوم' : 'Start Your Research Journey Today'}
                        </h2>
                        <p className="text-primary-100 mb-8 max-w-xl mx-auto">
                            {i18n.language === 'ar'
                                ? 'انضم إلى آلاف الباحثين من جميع أنحاء العالم'
                                : 'Join thousands of researchers from around the world'}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/register" className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3">
                                {t('nav.register')}
                            </Link>
                            <Link to="/contact" className="btn border-2 border-white text-white hover:bg-white/10 px-8 py-3">
                                {t('landing.hero.cta.contact')}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Available Conferences Section */}
            <section className="py-20 bg-secondary-50 dark:bg-secondary-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-secondary-800 dark:text-white mb-4">
                            {i18n.language === 'ar' ? 'المؤتمرات المتاحة' : 'Available Conferences'}
                        </h2>
                        <p className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
                            {i18n.language === 'ar'
                                ? 'تصفح المؤتمرات العلمية النشطة حالياً وقدم أبحاثك'
                                : 'Browse active scientific conferences and submit your research'}
                        </p>
                    </div>

                    {isLoadingConferences ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                        </div>
                    ) : conferences.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            {conferences.map((conf) => (
                                <Link
                                    key={conf.id}
                                    to="/register"
                                    className="card hover:shadow-xl transition-all duration-300 overflow-hidden p-0 group"
                                >
                                    <div className="relative h-48 w-full bg-secondary-100 dark:bg-secondary-700 overflow-hidden">
                                        <img
                                            src={conf.bannerUrl || 'https://placehold.co/600x400/4F46E5/FFFFFF?text=Conference'}
                                            alt={i18n.language === 'ar' ? conf.nameAr : conf.nameEn}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/4F46E5/FFFFFF?text=Conference')}
                                        />
                                        <div className="absolute top-4 start-4">
                                            <span className="badge badge-success shadow-md">
                                                {i18n.language === 'ar' ? 'متاح الآن' : 'Available Now'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-secondary-800 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {i18n.language === 'ar' ? conf.nameAr : conf.nameEn}
                                        </h3>
                                        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4 line-clamp-3 leading-relaxed">
                                            {i18n.language === 'ar' ? conf.descriptionAr : conf.descriptionEn}
                                        </p>
                                        <div className="flex flex-col gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                                            {conf.location && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">{conf.location}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 flex-shrink-0" />
                                                <span>{new Date(conf.startDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
                            <p className="text-secondary-600 dark:text-secondary-400">
                                {i18n.language === 'ar' ? 'لا توجد مؤتمرات متاحة حالياً' : 'No conferences available at the moment'}
                            </p>
                        </div>
                    )}

                    <div className="text-center">
                        <Link to="/research" className="btn-primary inline-flex items-center">
                            {i18n.language === 'ar' ? 'عرض جميع المؤتمرات' : 'View All Conferences'}
                            <ArrowRight className="w-4 h-4 ms-2" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
                    {[Shield, Zap, Users, Globe].map((Icon, index) => (
                        <div key={index} className="flex items-center gap-2 text-secondary-500">
                            <Icon className="w-6 h-6" />
                            <span className="text-sm">
                                {['Secure Platform', 'Fast Processing', 'Global Community', 'Multi-language'][index]}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
