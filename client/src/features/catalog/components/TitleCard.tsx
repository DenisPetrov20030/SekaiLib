import { Link } from 'react-router-dom';
import type { Title } from '../../../core/types';

type CatalogTitle = Title & {
  averageScore?: number | null;
  reviewsCount?: number;
};

interface TitleCardProps {
  title: CatalogTitle;
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
          
          {/* Блок рейтингу зліва, без окремого числового статусу */}
          <div className="flex items-center justify-start gap-2 mt-0.5">
            {title.averageScore != null && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 whitespace-nowrap">
                <span className="text-[12px] leading-none" aria-hidden="true">★</span>
                {title.averageScore.toFixed(1)} / 10
              </span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
};