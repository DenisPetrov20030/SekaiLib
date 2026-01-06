import { Link } from 'react-router-dom';
import type { Title } from '../../../core/types';

interface TitleCardProps {
  title: Title;
}

export const TitleCard = ({ title }: TitleCardProps) => {
  return (
    <Link
      to={`/titles/${title.id}`}
      className="group block bg-surface rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-200"
    >
      <div className="aspect-w-2 aspect-h-3 bg-surface-hover">
        {title.coverImageUrl ? (
          <img
            src={title.coverImageUrl}
            alt={title.name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-surface-hover">
            <span className="text-text-muted">No cover</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-400 line-clamp-2">
          {title.name}
        </h3>
        <p className="mt-1 text-sm text-text-secondary">{title.author}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-900 text-primary-100">
            {title.status}
          </span>
        </div>
      </div>
    </Link>
  );
};
