import type { Title } from '../../../core/types';
import { TitleCard } from './TitleCard';

interface TitleGridProps {
  titles: Title[];
}

export const TitleGrid = ({ titles }: TitleGridProps) => {
  if (!titles || titles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">Творів не знайдено</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {titles.map((title) => (
        <TitleCard key={title.id} title={title} />
      ))}
    </div>
  );
};
