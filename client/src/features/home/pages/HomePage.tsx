import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import axios from 'axios';
import { apiClient } from '../../../core/api';
import { ROUTES } from '../../../core/constants';

export const HomePage = () => {
    const navigate = useNavigate();
    const [latestChapters, setLatestChapters] = useState<any[]>([]);
    const [latestTitles, setLatestTitles] = useState<any[]>([]);
    // Додаємо стан для прогресу читання
    const [readingProgress, setReadingProgress] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleChapterClick = (titleId: string, chapterNumber: number) => {
        navigate(ROUTES.READER.replace(':titleId', titleId).replace(':chapterNumber', chapterNumber.toString()));
    };

    const getCountryLabel = (country?: string) => {
        if (!country) return 'Інше';
        const c = country.toLowerCase();
        if (c.includes('korea') || c.includes('коре')) return 'Південна Корея';
        if (c.includes('japan') || c.includes('япон')) return 'Японія';
        if (c.includes('china') || c.includes('кит')) return 'Китай';
        return 'Інше';
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Додаємо запит до API для отримання прогресу (якщо користувач авторизований)
                const [chaptersRes, titlesRes, progressRes] = await Promise.all([
                    axios.get('https://localhost:7054/api/titles/latest-chapters'),
                    axios.get('https://localhost:7054/api/titles/latest'),
                    // ВАЖЛИВО: використовуємо авторизований клієнт для токена
                    apiClient.get('/users/reading-progress').catch(() => ({ data: [] as any[] }))
                ]);

                setLatestChapters(chaptersRes.data);
                setLatestTitles(titlesRes.data);
                setReadingProgress(Array.isArray(progressRes.data) ? progressRes.data : []);
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
                // ігноруємо якщо неавторизований
            }
        };

        fetchData();

        // Додатково підписуємося на повернення фокусу/видимість сторінки,
        // щоб прогрес оновлювався після виходу з рідера
        const onFocus = () => refreshProgress();
        const onVisibility = () => { if (document.visibilityState === 'visible') refreshProgress(); };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        // Підпишемося на кастомне подія із ReaderPage
        window.addEventListener('reading-progress-updated', onFocus);

        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
            window.removeEventListener('reading-progress-updated', onFocus);
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
        // Оптимістично прибираємо з локального стану
        setReadingProgress((prev) => prev.filter((x) => x.titleId !== titleId));
        try {
            await apiClient.delete(`/users/reading-progress/${titleId}`);
            // Перечитуємо актуальні дані з сервера, щоб виключити повернення після перезавантаження
            const res = await apiClient.get('/users/reading-progress');
            setReadingProgress(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error('Не вдалося видалити тайтл з продовження', e);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">

            {/* СЕКЦІЯ 1: СЛАЙДЕР ГЛАВ */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                    <span className="w-1 h-8 bg-orange-500 rounded-full"></span>
                    Останні переклади глав
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

            {/* НОВА СЕКЦІЯ: ПРОДОВЖИТИ ЧИТАТИ */}
            {readingProgress?.length > 0 && (
                <section className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white">Продовжити читати</h2>
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
                                            Глава {item.chapterNumber} — {item.totalPages > 0 ? Math.round((Math.min((item.currentPage ?? 0) + 1, item.totalPages) / item.totalPages) * 100) : 0}%
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

            {/* СЕКЦІЯ 2: ОСТАННІ ДОДАНІ ТАЙТЛИ */}
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