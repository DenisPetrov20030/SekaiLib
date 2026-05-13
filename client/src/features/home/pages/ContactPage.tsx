export const ContactPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-4">Контакти</h1>
          <p className="text-text-secondary text-lg">
            Маєте питання або пропозиції? Ми готові вас вислухати!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-surface rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-bold text-primary-500 mb-3">Email</h2>
              <p className="text-text-secondary">
                support@sekailib.com
              </p>
              <p className="text-text-muted text-sm mt-2">
                Напишіть нам, і ми відповімо якомога швидше
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-bold text-primary-500 mb-3">Розташування</h2>
              <p className="text-text-secondary">
                Україна
              </p>
              <p className="text-text-muted text-sm mt-2">
                Житомир
              </p>
            </div>

            <div className="bg-surface rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-bold text-primary-500 mb-3">Години Роботи</h2>
              <p className="text-text-secondary">
                24/7 - ми завжди на зв'язку
              </p>
              <p className="text-text-muted text-sm mt-2">
                Відповіді на запити надходять упродовж 24 годин
              </p>
            </div>
          </div>

          {/* Message Form Placeholder */}
          <div className="bg-surface rounded-lg p-8 border border-white/10 h-fit">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Надішліть повідомлення</h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-text-secondary text-sm font-medium mb-2">
                  Ім'я
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Ваше ім'я"
                  className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-text-secondary text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary-500 transition"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-text-secondary text-sm font-medium mb-2">
                  Повідомлення
                </label>
                <textarea
                  id="message"
                  placeholder="Напишіть ваше повідомлення..."
                  rows={5}
                  className="w-full px-4 py-2 bg-background border border-white/10 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-primary-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition"
              >
                Надіслати
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
