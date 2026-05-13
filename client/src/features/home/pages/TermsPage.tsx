export const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Умови Використання</h1>
          <p className="text-text-muted text-sm">
            Останнє оновлення: {new Date().toLocaleDateString('uk-UA')}
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">1. Прийняття Умов</h2>
            <p className="text-text-secondary leading-relaxed">
              Використовуючи SekaiLib, ви погоджуєтесь з цими умовами використання. 
              Якщо ви не згодні з будь-якою частиною цих умов, будь ласка, не користуйтесь нашим сервісом.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">2. Користувацькі Облікові Записи</h2>
            <p className="text-text-secondary leading-relaxed">
              При реєстрації на SekaiLib ви беретеся на себе відповідальність за всю діяльність, 
              яка відбувається під вашим обліковим записом. Ви зобов'язані забезпечити конфіденційність 
              вашого пароля та не передавати його іншим особам.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">3. Контент Користувачів</h2>
            <p className="text-text-secondary leading-relaxed">
              Ви можете завантажувати контент (рецензії, коментарі, списки) на нашу платформу. 
              Ви надаєте SekaiLib права на використання цього контенту в межах функціонування сервісу.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">4. Заборонена Діяльність</h2>
            <p className="text-text-secondary leading-relaxed mb-3">
              Ви не маєте права:
            </p>
            <ul className="space-y-2 text-text-secondary ml-4">
              <li>• Публікувати образливий, дискримінаційний або незаконний контент</li>
              <li>• Спам, фішинг або інші форми шахрайства</li>
              <li>• Порушувати авторські права та права інтелектуальної власності</li>
              <li>• Турбувати інших користувачів</li>
              <li>• Спаму чи розповсюджувати вредонос</li>
            </ul>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">5. Модерація та Видалення</h2>
            <p className="text-text-secondary leading-relaxed">
              SekaiLib залишає за собою право видаляти контент, який порушує ці умови, 
              без попередження та без видання причин.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">6. Обмеження Відповідальності</h2>
            <p className="text-text-secondary leading-relaxed">
              SekaiLib надається «як є» без гарантій. Ми не несемо відповідальність за 
              будь-які збитки або втрати, які можуть виникнути внаслідок використання нашого сервісу.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">7. Зміни Умов</h2>
            <p className="text-text-secondary leading-relaxed">
              Ми можемо змінювати ці умови в будь-який час. Продовження використання сервісу означає 
              вашу згоду з оновленими умовами.
            </p>
          </section>

          <section className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">8. Контакт</h2>
            <p className="text-text-secondary leading-relaxed">
              Якщо у вас є питання щодо цих умов, будь ласка, зв'яжіться з нами за адресою support@sekailib.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
