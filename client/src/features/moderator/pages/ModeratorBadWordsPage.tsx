import { useEffect, useState } from 'react';
import { moderationApi, type BadWordDto } from '../../../core/api/moderation';

export function ModeratorBadWordsPage() {
  const [words, setWords] = useState<BadWordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    moderationApi.getBadWords()
      .then((r) => setWords(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newWord.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await moderationApi.addBadWord(newWord.trim());
      setNewWord('');
      load();
    } catch (e: any) {
      setError(e?.response?.data?.errors?.Word?.[0] ?? e?.response?.data?.message ?? 'Помилка');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    await moderationApi.removeBadWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Стоп-слова</h1>

      {/* Add form */}
      <div className="bg-surface-800 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">Додати слово</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Нове стоп-слово..."
            className="flex-1 bg-surface-900 border border-surface-600 rounded-lg px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newWord.trim()}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg disabled:opacity-50"
          >
            Додати
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">Список порожній</div>
      ) : (
        <div className="bg-surface-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700">
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Слово</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Додав</th>
                <th className="text-left px-4 py-3 text-text-secondary font-medium">Дата</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {words.map((word) => (
                <tr key={word.id} className="border-b border-surface-700/50 hover:bg-surface-700/30">
                  <td className="px-4 py-3 text-text-primary font-mono">{word.word}</td>
                  <td className="px-4 py-3 text-text-secondary">{word.addedByUsername}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(word.createdAt).toLocaleDateString('uk-UA')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(word.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
