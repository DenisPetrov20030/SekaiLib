import { useState } from 'react';
import { Button, Textarea } from '../../../shared/components';
import type { ApiError } from '../../../core/types';

interface ReviewFormProps {
  onSubmit: (title: string, content: string, rating: number) => Promise<void>;
  initialTitle?: string;
  initialContent?: string;
  initialRating?: number;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ReviewForm({
  onSubmit,
  initialTitle = '',
  initialContent = '',
  initialRating = 5,
  submitLabel = 'Надіслати',
  onCancel,
}: ReviewFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleMaxLength = 200;
  const contentMaxLength = 2000;

  const getErrorMessage = (e: unknown) => {
    const apiError = e as ApiError & { response?: { data?: ApiError } };
    const serverErrors = apiError?.errors ?? apiError?.response?.data?.errors;

    if (serverErrors) {
      const firstFieldErrors = Object.values(serverErrors).find((value) => value?.length);
      if (firstFieldErrors?.length) {
        return firstFieldErrors[0];
      }
    }

    return apiError?.message || 'Не вдалося відправити рецензію';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (title.trim().length > titleMaxLength) {
      setError('Зменшіть кількість символів у заголовку рецензії');
      return;
    }

    if (content.trim().length > contentMaxLength) {
      setError('Зменшіть кількість символів у рецензії');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(title, content, rating);
      setTitle('');
      setContent('');
      setRating(5);
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок рецензії"
          maxLength={titleMaxLength}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary-500"
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>Назва рецензії</span>
          <span>{title.length} / {titleMaxLength}</span>
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Напишіть вашу рецензію..."
        rows={4}
        maxLength={contentMaxLength}
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>Максимум {contentMaxLength} символів</span>
        <span>{content.length} / {contentMaxLength}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Рейтинг:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  value <= rating
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-700 text-text-muted hover:bg-surface-600'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={loading} disabled={!title.trim() || !content.trim()}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Скасувати
          </Button>
        )}
      </div>
    </form>
  );
}
