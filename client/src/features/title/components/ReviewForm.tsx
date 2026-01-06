import { useState } from 'react';
import { Button, Textarea } from '../../../shared/components';

interface ReviewFormProps {
  onSubmit: (content: string, rating: number) => Promise<void>;
  initialContent?: string;
  initialRating?: number;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ReviewForm({
  onSubmit,
  initialContent = '',
  initialRating = 5,
  submitLabel = 'Submit',
  onCancel,
}: ReviewFormProps) {
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onSubmit(content, rating);
      setContent('');
      setRating(5);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your review..."
        rows={4}
      />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">Rating:</span>
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
      <div className="flex gap-2">
        <Button type="submit" loading={loading} disabled={!content.trim()}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
