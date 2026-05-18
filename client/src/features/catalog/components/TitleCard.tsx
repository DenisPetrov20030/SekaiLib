import { Link } from 'react-router-dom';
import type { Title } from '../../../core/types';

interface TitleCardProps {
  title: Title;
}

export const TitleCard = ({ title }: TitleCardProps) => {
  return (
    <Link
      to={`/titles/${title.id}`}
      className="group flex flex-col h-full bg-surface rounded-xl shadow-lg overflow-hidden border border-surface-hover/50 hover:border-primary-500/30 transition-all duration-300 hover:shadow-primary-500/5 select-none"
    >
      {/* Контейнер обкладинки з фіксованим аспект-ратіо */}
      <div className="relative w-full aspect-[2/3] bg-surface-hover overflow-hidden isolate">
        {title.coverImageUrl ? (
          <img
            src={title.coverImageUrl}
            alt={title.name}
            loading="eager"
            decoding="sync"
            // object-cover гарантує повне заповнення без смуг, а group-hover додає преміальний ефект легкого збільшення
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-hover">
            <span className="text-text-muted text-sm font-medium">Немає обкладинки</span>
          </div>
        )}
        
        {/* Акуратний темний градієнт знизу обкладинки для об'єму */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
      </div>

      {/* Контентий блок, який розтягується рівномірно завдяки flex-1 */}
      <div className="flex flex-col flex-1 p-3.5 bg-surface">
        
        {/* Заголовок фіксованої висоти на 2 рядки (line-clamp-2), щоб наступні елементи не стрибали */}
        <div className="min-h-[3.5rem] mb-1">
          <h3 className="text-base font-bold text-text-primary group-hover:text-primary-400 line-clamp-2 transition-colors duration-200 leading-snug">
            {title.name}
          </h3>
        </div>

        {/* Блок автора та мета-даних, який автоматично притискається до низу */}
        <div className="mt-auto pt-2 border-t border-surface-hover/60 flex flex-col gap-2">
          <p className="text-xs text-text-secondary font-medium line-clamp-1 italic">
            {title.author || 'Невідомий автор'}
          </p>
          
          {/* Симетричний бічний розподіл: Статус ліворуч, Рейтинг/Тип праворуч */}
          <div className="flex items-center justify-between mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-500/10 text-primary-400 border border-primary-550/20">
              {title.status}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
};