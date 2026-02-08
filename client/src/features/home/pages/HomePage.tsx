import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import axios from 'axios';
import { ROUTES } from '../../../core/constants';

export const HomePage = () => {
    const navigate = useNavigate();
    const [latestChapters, setLatestChapters] = useState<any[]>([]);
    const [latestTitles, setLatestTitles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const handleChapterClick = (titleId: string, chapterNumber: number) => {
        navigate(ROUTES.READER.replace(':titleId', titleId).replace(':chapterNumber', chapterNumber.toString()));
    };

    const getCountryLabel = (country?: string) => {
        if (!country) return 'Інше'; //
        
        const c = country.toLowerCase();
        
        if (c.includes('korea') || c.includes('коре')) return 'Південна Корея'; //
        if (c.includes('japan') || c.includes('япон')) return 'Японія'; //
        if (c.includes('china') || c.includes('кит')) return 'Китай'; //
        
        return 'Інше'; 
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [chaptersRes, titlesRes] = await Promise.all([
                    axios.get('https://localhost:7054/api/titles/latest-chapters'), 
                    axios.get('https://localhost:7054/api/titles/latest')
                ]);
                
                setLatestChapters(chaptersRes.data);
                setLatestTitles(titlesRes.data);
            } catch (err) {
                console.error("Помилка завантаження даних", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-white">Завантаження...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            
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