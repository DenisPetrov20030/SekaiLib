export const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Політика Конфіденційності</h1>
          <p className="text-text-muted text-sm">
            Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">1. Вступ</h2>
            <p className="text-text-secondary leading-relaxed">
              SekaiLib поважає вашу приватність. Ця політика конфіденційності пояснює, 
              як ми збираємо, використовуємо та захищаємо ваші персональні дані.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">2. Дані, що Збираються</h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              Ми можемо збирати:
            </p>
            <ul className="space-y-2 text-text-secondary ml-4">
              <li>• Інформація про реєстрацію (ім'я користувача, email, пароль)</li>
              <li>• Профільна інформація (аватар, біографія, улюблені жанри)</li>
              <li>• Дані про активність (читання, рецензії, коментарі)</li>
              <li>• Технічна інформація (IP-адреса, тип браузера, ОС)</li>
              <li>• Файли cookie та подібні технології відстеження</li>
            </ul>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">3. Використання Даних</h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              Ми використовуємо дані для:
            </p>
            <ul className="space-y-2 text-text-secondary ml-4">
              <li>• Надання послуг та функцій платформи</li>
              <li>• Персоналізації вашого досвіду</li>
              <li>• Покращення та оптимізації нашого сервісу</li>
              <li>• Комунікації з вами про оновлення та новини</li>
              <li>• Захисту від шахрайства та зловживань</li>
            </ul>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">4. Розповсюдження Даних</h2>
            <p className="text-text-secondary leading-relaxed">
              Ми не продаємо ваші персональні дані третім сторонам. Однак ми можемо ділитися 
              невизначеною інформацією з нашими партнерами для покращення послуг.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">5. Безпека Даних</h2>
            <p className="text-text-secondary leading-relaxed">
              Ми вживаємо розумних заходів для захисту ваших даних від несанкціонованого доступу. 
              Однак жодна система не є абсолютно безпечною.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">6. Ваші Права</h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              Ви маєте право:
            </p>
            <ul className="space-y-2 text-text-secondary ml-4">
              <li>• Отримати копію своїх персональних даних</li>
              <li>• Вимагати виправлення неточних даних</li>
              <li>• Видалити свій обліковий запис та дані</li>
              <li>• Відмовитися від отримання комунікацій з маркетингу</li>
            </ul>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">7. Cookie</h2>
            <p className="text-text-secondary leading-relaxed">
              SekaiLib використовує cookie для збереження переваг користувача та 
              отримання аналітики. Ви можете керувати cookie через налаштування браузера.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">8. Контакт</h2>
            <p className="text-text-secondary leading-relaxed">
              Якщо у вас є питання щодо цієї політики конфіденційності, зв'яжіться з нами: support@sekailib.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
