import { Link } from 'react-router-dom';
import { ROUTES } from '../../../core/constants';
import type { CollectionDto } from '../../../core/api/collections';

interface Props {
  collection: CollectionDto;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);
  if (diffH < 1) return 'щойно';
  if (diffH < 24) return `${diffH} год. тому`;
  if (diffD < 30) return `${diffD} д. тому`;
  return d.toLocaleDateString('uk-UA');
};

export const CollectionCard = ({ collection }: Props) => {
  const to = ROUTES.COLLECTION_DETAILS.replace(':id', collection.id);
  const covers = collection.coverImages.slice(0, 3);

  return (
    <Link
      to={to}
      className="group flex flex-col rounded-xl border border-divider bg-surface hover:border-white/20 transition-all duration-200 overflow-hidden"
    >
      {/* Cover preview */}
      <div className="relative h-40 bg-surface-hover overflow-hidden isolate">
        {covers.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-14 h-14 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        ) : covers.length === 1 ? (
          /* ПРАВИЛЬНИЙ ФІКС ДЛЯ ОДНОГО ТАЙТЛУ: картинка центрується та не обрізається */
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {/* Задній великий розмитий фон з обкладинки */}
            <img
              src={covers[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-25 pointer-events-none"
            />
            {/* Оригінальна обкладинка з правильним співвідношенням сторін книги (aspect-[2/3]) */}
            <div className="relative h-[90%] aspect-[2/3] rounded-md overflow-hidden shadow-md border border-white/10">
              <img
                src={covers[0]}
                alt=""
                loading="eager"
                decoding="sync"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        ) : (
          /* ДЛЯ КІЛЬКОХ ТАЙТЛІВ: залишаємо твій фірмовий стек зі зсувом */
          <div className="absolute inset-0 flex items-end justify-center gap-0.5 bg-neutral-900/20 px-2 py-1">
            {covers.map((cover, index) => (
              <div
                key={cover + index}
                className={`relative h-full w-1/3 overflow-hidden rounded-md border border-white/10 shadow-lg bg-black/20 ${
                  index === 0
                    ? 'rotate-[-4deg] translate-y-1'
                    : index === 1
                      ? 'z-10 scale-105'
                      : 'rotate-[4deg] translate-y-1'
                }`}
              >
                <img
                  src={cover}
                  alt=""
                  loading="eager"
                  decoding="sync"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Stats overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 py-2 flex items-center gap-3 text-xs text-white/90 z-20">
          <span title="Перегляди" className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            {collection.viewCount}
          </span>
          <span title="Коментарі" className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            {collection.commentCount}
          </span>
          <span title="Твори" className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            {collection.titleCount}
          </span>
          <span title="Оцінки" className="ml-auto flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
            {collection.likeCount}
            <span className="opacity-50">/</span>
            {collection.dislikeCount}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-text-primary line-clamp-2 group-hover:text-primary-400 transition-colors leading-snug">
          {collection.title}
        </h3>
        {collection.description && (
          <p className="text-xs text-text-muted line-clamp-2">{collection.description}</p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2 border-t border-divider">
          {collection.authorAvatarUrl ? (
            <img
              src={collection.authorAvatarUrl}
              alt={collection.authorUsername}
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-surface-hover flex items-center justify-center text-[10px] font-bold text-text-muted">
              {collection.authorUsername.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-text-muted truncate">{collection.authorUsername}</span>
          <span className="text-xs text-text-muted ml-auto flex-shrink-0">{formatDate(collection.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};