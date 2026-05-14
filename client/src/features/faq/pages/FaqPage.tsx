import { Link } from 'react-router-dom';

// Тип для категорії FAQ
// Оновлений тип без статичного count
type FaqCategory = { id: string; title: string };

export const FAQ_CATEGORIES: FaqCategory[] = [
  { id: 'ranobe', title: 'Ранобе' },
  { id: 'general', title: 'Загальні питання' },
  { id: 'profile', title: 'Профіль користувача' },
  { id: 'reading', title: 'Читання ранобе' },
  { id: 'comments', title: 'Коментарі' },
  { id: 'chat', title: 'Чат' },
  { id: 'troubleshooting', title: 'Вирішення проблем' },
  { id: 'rules', title: 'Правила' },
  { id: 'forum', title: 'Форум' },
  { id: 'tips', title: 'Підказки' },
];

export function FaqPage() {
  // Немає відображення кількості статей — показуємо лише блоки

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-2">FAQ</h1>
      <p className="text-text-muted mb-8">Відповіді на поширені запитання</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {FAQ_CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to={`/faq/${cat.id}`}
            className="bg-surface-800 rounded-lg p-4 border border-surface-700 hover:border-primary-500 hover:bg-surface-hover transition-colors block"
          >
            <h3 className="text-text-primary font-medium text-[15px] mb-1.5">{cat.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}