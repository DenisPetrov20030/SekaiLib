export const AboutPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Про SekaiLib</h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            SekaiLib - це веб-платформа, яка присвячена світу ранобе.
            Наша мета - створити спільноту, де читачі можуть ділитися своїми улюбленими творами,
            обговорювати їх, залишати рецензії та будувати списки для читання.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">Наша Місія</h2>
            <p className="text-text-secondary">
              Надати зручну та інтуїтивну платформу для читання та обговорення творів, які захоплюють тисячі читачів
              по всьому світу.
            </p>
          </div>

          <div className="bg-surface rounded-lg p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-primary-500 mb-3">Наші Цінності</h2>
            <p className="text-text-secondary">
              Ми вважаємо в силу спільноти, відкритої комунікації та любові до азійської поп-культури.
            </p>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Що ми пропонуємо</h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex items-start space-x-3">
              <span className="text-primary-500 mt-1">•</span>
              <span>Каталог ранобе з детальною інформацією</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-primary-500 mt-1">•</span>
              <span>Читання розділів онлайн</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-primary-500 mt-1">•</span>
              <span>Рецензії та системи оцінок від спільноти</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-primary-500 mt-1">•</span>
              <span>Списки для читання та персональні колекції</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-primary-500 mt-1">•</span>
              <span>Спілкування з іншими читачами через коментарі та повідомлення</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="text-primary-500 mt-1">•</span>
              <span>Новини та оновлення з світу ранобе</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
