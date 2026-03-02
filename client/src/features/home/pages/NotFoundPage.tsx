import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../core/constants';

export const NotFoundPage = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Обчислюємо зміщення відносно центру екрана
      const x = (e.clientX - window.innerWidth / 2) / 25;
      const y = (e.clientY - window.innerHeight / 2) / 25;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-black overflow-hidden relative">
      {/* Декоративні частинки на фоні */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-red-500 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `translate(${mousePos.x * (i * 0.1)}px, ${mousePos.y * (i * 0.1)}px)`,
              transition: 'transform 0.2s ease-out'
            }}
          />
        ))}
      </div>

      <div className="text-center z-10">
        <div className="relative inline-block">
          {/* Головні цифри з паралакс-ефектом */}
          <h1 
            className="text-[150px] md:text-[250px] font-black leading-none tracking-tighter text-white select-none transition-transform duration-75 ease-out"
            style={{ 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              textShadow: `${-mousePos.x}px ${-mousePos.y}px 0px rgba(220, 38, 38, 0.5)` 
            }}
          >
            404
          </h1>
          
          {/* Тінь, що рухається в протилежний бік */}
          <div 
            className="absolute inset-0 flex items-center justify-center -z-10 opacity-30 blur-xl text-red-600 text-[150px] md:text-[250px] font-black"
            style={{ transform: `translate(${-mousePos.x * 1.5}px, ${-mousePos.y * 1.5}px)` }}
          >
            404
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-[0.3em]">
            Сторінку не знайдено
          </h2>
          <p className="text-zinc-300 max-w-sm mx-auto text-sm font-medium">
            Можливо, посилання застаріло, сторінку переміщено або вона тимчасово недоступна.
          </p>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={ROUTES.HOME}
            className="bg-red-600 hover:bg-red-500 text-white font-black px-10 py-4 rounded-full uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-red-900/40"
          >
            На головну
          </Link>
          <Link
            to={ROUTES.CATALOG}
            className="bg-zinc-700 hover:bg-zinc-600 border border-zinc-500 text-white px-10 py-4 rounded-full uppercase text-[10px] font-black tracking-widest transition-all"
          >
            До каталогу
          </Link>
        </div>
      </div>
    </section>
  );
};