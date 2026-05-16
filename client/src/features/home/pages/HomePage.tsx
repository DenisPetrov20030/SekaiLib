import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { apiClient } from '../../../core/api';
import { newsApi } from '../../../core/api/news';
import { teamsApi } from '../../../core/api/teams';
import { ROUTES } from '../../../core/constants';
import { useAppSelector } from '../../../app/store/hooks';
import type { SubscribedTeamChapterDto } from '../../../core/types/dtos';
import type { NewsItem } from '../../../core/types/entities';

export const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);
    const [showNewsSlider, setShowNewsSlider] = useState(false);
    const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
    const [latestChapters, setLatestChapters] = useState<any[]>([]);
    const [latestTitles, setLatestTitles] = useState<any[]>([]);
    const [readingProgress, setReadingProgress] = useState<any[]>([]);
    const [subscribedChapters, setSubscribedChapters] = useState<SubscribedTeamChapterDto[]>([]);
    const [loading, setLoading] = useState(true);

    const handleChapterClick = (titleId: string, chapterNumber: number) => {
        navigate(ROUTES.READER.replace(':titleId', titleId).replace(':chapterNumber', chapterNumber.toString()));
    };

    const getCountryLabel = (country?: string) => {
        if (!country) return 'інше';
        const c = country.toLowerCase();
        if (c.includes('korea') || c.includes('корея')) return 'Південна Корея';
        if (c.includes('japan') || c.includes('японія')) return 'Японія';
        if (c.includes('china') || c.includes('китай')) return 'Китай';
        return 'Інше';
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [newsRes, chaptersRes, titlesRes, progressRes] = await Promise.all([
                    newsApi.getPublished(1, 8).catch(() => ({ data: { data: [] as NewsItem[] } })),
                    apiClient.get<any[]>('/titles/latest-chapters'),
                    apiClient.get<any[]>('/titles/latest'),
                    apiClient.get('/users/reading-progress').catch(() => ({ data: [] as any[] }))
                ]);

                const fetchedNews = Array.isArray(newsRes.data.data) ? newsRes.data.data : [];
                setNewsItems(fetchedNews);

                // Show banner only if user hasn't dismissed the latest news item
                const latestId = fetchedNews[0]?.id;
                const dismissedId = localStorage.getItem('news_banner_dismissed');
                if (latestId && dismissedId !== latestId) {
                    setShowNewsSlider(true);
                }
                setLatestChapters(chaptersRes.data);
                setLatestTitles(titlesRes.data);
                setReadingProgress(Array.isArray(progressRes.data) ? progressRes.data : []);

                if (user) {
                    teamsApi.getSubscribedChapters(20)
                        .then(setSubscribedChapters)
                        .catch(() => {});
                }
            } catch (err) {
                console.error("Помилка завантаження даних", err);
            } finally {
                setLoading(false);
            }
        };

        const refreshProgress = async () => {
            try {
                const res = await apiClient.get('/users/reading-progress');
                setReadingProgress(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
            }
        };

        fetchData();

        const onFocus = () => refreshProgress();
        const onVisibility = () => { if (document.visibilityState === 'visible') refreshProgress(); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        window.addEventListener('reading-progress-updated', onFocus);

        const onAuthChanged = (e: Event) => {
            const ev = e as CustomEvent<{ token: string | null }>;
            if (!ev.detail?.token) {
                setReadingProgress([]);
            } else {
                refreshProgress();
            }
        };

        window.addEventListener('auth-token-changed', onAuthChanged as EventListener);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('reading-progress-updated', onFocus);
            window.removeEventListener('auth-token-changed', onAuthChanged as EventListener);
        };
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-white">Завантаження...</div>;
    }

    const handleClearProgress = async () => {
        try {
            await apiClient.delete('/users/reading-progress');
            setReadingProgress([]);
        } catch (e) {
            console.error('Не вдалося очистити прогрес читання', e);
        }
    };

    const handleRemoveItem = async (titleId: string) => {
        setReadingProgress((prev) => prev.filter((x) => x.titleId !== titleId));
        try {
            await apiClient.delete(`/users/reading-progress/${titleId}`);
            const res = await apiClient.get('/users/reading-progress');
            setReadingProgress(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Не вдалося видалити тайтл з продовження', e);
        }
    };

    const handleHideNewsSlider = () => {
        setShowNewsSlider(false);
        const latestId = newsItems[0]?.id;
        if (latestId) {
            localStorage.setItem('news_banner_dismissed', latestId);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">

            {showNewsSlider && newsItems.length > 0 && (
                <section className="relative bg-gray-900/50 rounded-2xl border border-gray-800 p-4 sm:p-6">
                    <button
                        type="button"
                        onClick={handleHideNewsSlider}
                        aria-label="Приховати новини"
                        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    >
                        ×
                    </button>

                    <div className="flex items-center gap-2 mb-4 pr-10">
                        <span className="w-1 h-7 bg-amber-500 rounded-full"></span>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Новини</h2>
                    </div>

                    <Swiper
                        modules={[Navigation]}
                        navigation
                        spaceBetween={12}
                        slidesPerView={1}
                        breakpoints={{
                            768: { slidesPerView: 2 },
                            1200: { slidesPerView: 3 },
                        }}
                    >
                        {newsItems.map((item) => (
                            <SwiperSlide key={item.id}>
                                <Link
                                    to={ROUTES.NEWS_DETAILS.replace(':id', item.id)}
                                    className="group block h-full rounded-xl border border-gray-700 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 p-4 hover:border-amber-500/60 transition-colors"
                                >
                                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-400/80 mb-2">
                                        <span>Новина</span>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400 normal-case tracking-normal">
                                            {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                                        </span>
                                    </div>
                                    <h3 className="text-white font-semibold leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-300 line-clamp-3">
                                        {item.content.replace(/<[^>]*>/g, '').trim()}
                                    </p>
                                    <p className="mt-3 text-xs text-gray-500">
                                        {item.authorUsername}
                                    </p>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                    <span className="w-1 h-8 bg-orange-500 rounded-full"></span>
                    Останні додані глав
                </h2>
                <Swiper
                    modules={[Navigation]}
                    navigation
                    spaceBetween={15}
                    slidesPerView={2.2}
                    breakpoints={{
                        640: { slidesPerView: 3.5 },
                        1024: { slidesPerView: 5.5 },
                    }}
                >
                    {latestChapters.map((chapter: any) => (
                        <SwiperSlide key={chapter.id}>
                            <div
                                onClick={() => handleChapterClick(chapter.title?.id, chapter.number)}
                                className="relative group overflow-hidden rounded-xl bg-gray-900 aspect-[2/3] block cursor-pointer"
                            >
                                <img
                                    src={chapter.title?.coverImageUrl}
                                    alt={chapter.title?.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-80"
                                />
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent text-left">
                                    <span className="inline-block bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                                        Глава {chapter.number}
                                    </span>
                                    <p className="text-white text-sm font-semibold truncate">
                                        {chapter.title?.name}
                                    </p>
                                    <p className="text-gray-400 text-[10px]">
                                        {getCountryLabel(chapter.title?.countryOfOrigin)}
                                    </p>
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </section>

            {subscribedChapters.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-1 h-8 bg-purple-500 rounded-full"></span>
                        <h2 className="text-2xl font-bold text-white">Оновлення від команд</h2>
                        <Link
                            to={ROUTES.TEAMS}
                            className="ml-auto text-xs text-gray-400 hover:text-purple-400 uppercase tracking-wider transition"
                        >
                            всі команди →
                        </Link>
                    </div>
                    <Swiper
                        modules={[Navigation]}
                        navigation
                        spaceBetween={15}
                        slidesPerView={2.2}
                        breakpoints={{
                            640: { slidesPerView: 3.5 },
                            1024: { slidesPerView: 5.5 },
                        }}
                    >
                        {subscribedChapters.map((ch) => (
                            <SwiperSlide key={ch.chapterId}>
                                <div
                                    onClick={() =>
                                        navigate(
                                            ROUTES.READER
                                                .replace(':titleId', ch.titleId)
                                                .replace(':chapterNumber', ch.chapterNumber.toString())
                                        )
                                    }
                                    className="relative group overflow-hidden rounded-xl bg-gray-900 aspect-[2/3] block cursor-pointer"
                                >
                                    {ch.titleCoverImageUrl ? (
                                        <img
                                            src={ch.titleCoverImageUrl}
                                            alt={ch.titleName}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 opacity-80"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                            <span className="text-4xl font-bold text-gray-600">
                                                {ch.titleName.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent text-left">
                                        <span className="inline-block bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">
                                            Глава {ch.chapterNumber}
                                        </span>
                                        <p className="text-white text-sm font-semibold truncate">
                                            {ch.titleName}
                                        </p>
                                        <p className="text-gray-400 text-[10px] truncate">
                                            {ch.teamName}
                                        </p>
                                    </div>
                                    {ch.isPremium && (
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            Premium
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </section>
            )}

            {readingProgress?.length > 0 && (
                <section className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Продовжити читання</h2>
                        <button onClick={handleClearProgress} className="text-xs text-gray-500 hover:text-orange-500 uppercase tracking-wider transition">
                            очистити
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {readingProgress.map((item) => (
                            <div key={item.titleId} className="relative group">
                                <Link
                                    to={ROUTES.READER.replace(':titleId', item.titleId).replace(':chapterNumber', item.chapterNumber.toString()) + `?page=${item.currentPage ?? 0}`}
                                    className="flex items-center gap-4 p-4 bg-gray-800/40 rounded-xl hover:bg-gray-800 transition"
                                >
                                    <img
                                        src={item.coverImageUrl}
                                        className="w-16 h-20 object-cover rounded-md shadow-md"
                                        alt={item.titleName}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold truncate group-hover:text-orange-500 transition">
                                            {item.titleName}
                                        </h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Глава {item.chapterNumber} —  {item.totalPages > 0 ? Math.round((Math.min((item.currentPage ?? 0) + 1, item.totalPages) / item.totalPages) * 100) : 0}%
                                        </p>
                                        <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                            <div
                                                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(item.totalPages > 0 ? (Math.min((item.currentPage ?? 0) + 1, item.totalPages) / item.totalPages) * 100 : 0)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </Link>

                                <button
                                    type="button"
                                    title="Видалити з продовження"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveItem(item.titleId); }}
                                    className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md cursor-pointer pointer-events-auto"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

 
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                    <span className="w-1 h-8 bg-blue-500 rounded-full"></span>
                    Останні додані тайтли
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                    {latestTitles.slice(0, 10).map((title: any) => (
                        <Link
                            key={title.id}
                            to={ROUTES.TITLE_DETAILS.replace(':id', title.id)}
                            className="group text-left block"
                        >
                            <div className="overflow-hidden rounded-lg mb-2 shadow-lg h-60 flex items-center justify-center bg-gray-900">
                                <img
                                    src={title.coverImageUrl}
                                    alt={title.name}
                                    className="max-w-full max-h-full object-contain group-hover:brightness-75 transition duration-300"
                                />
                            </div>
                            <h3 className="text-sm font-bold truncate group-hover:text-orange-500 transition text-white">
                                {title.name}
                            </h3>
                            <p className="text-xs text-gray-500">{title.author}</p>
                            <p className="text-xs text-gray-400">
                                {getCountryLabel(title.countryOfOrigin)}
                            </p>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};
