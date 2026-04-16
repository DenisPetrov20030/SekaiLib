 🏮 SekaiLib - Веб-платформа для читання та каталогізації ранобе

<p align="center">
  <img src="https://img.shields.io/badge/.NET-8.0-purple?logo=dotnet" alt=".NET 8">
  <img src="https://img.shields.io/badge/React-2025-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql" alt="PostgreSQL">
  <br>
  <a href="https://git.ztu.edu.ua/ipz/2022-2026/ipz-22-4/petrov-denys/sekailib/-/pipelines">
    <img src="https://git.ztu.edu.ua/ipz/2022-2026/ipz-22-4/petrov-denys/sekailib/badges/main/pipeline.svg" alt="Pipeline Status">
  </a>
</p>

---

 📝 Опис проекту
SekaiLib - це кваліфікаційна робота, спрямована на створення зручного середовища для читачів японських лайт-новел. Основна мета проекту - вирішити проблему синхронізації прогресу читання між різними пристроями та надати зручний інтерфейс для взаємодії з ком'юніті.

 ✨ Ключові можливості
- Персональна бібліотека: Додавання тайтлів у списки "Читаю", "Заплановано", "Завершено".
- Синхронізація прогресу Збереження конкретної сторінки та розділу для кожного ранобе.
- Соціальна взаємодія: Система друзів, запитів у друзі та сповіщень.
- Docker: Повна ізоляція середовища для швидкого розгортання.

 🏗 Архітектура системи
Проект побудований за принципами Clean Architecture:
- Domain: Сутності (Users, Titles, Chapters) та бізнес-правила.
- Application: DTOs, інтерфейси та логіка сервісів.
- Infrastructure: Реалізація БД через Entity Framework Core та PostgreSQL.
- Presentation: ASP.NET Core Web API з інтегрованим Swagger та логуванням.

 🛠 Технологічний стек
| Компонент | Технологія |
| :--- | :--- |
| Backend | .NET 8 (C#) |
| Frontend | React + TypeScript + Tailwind CSS |
| Database | PostgreSQL 16 |
| Logging | Structured ILogger (File/Console) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitLab CI/CD, GitHub Actions |

 🚀 Встановлення та запуск

 Вимоги
- Docker Desktop
- Git

 Запуск через Docker
```bash
git clone [https://git.ztu.edu.ua/ipz/2022-2026/ipz-22-4/petrov-denys/sekailib.git](https://git.ztu.edu.ua/ipz/2022-2026/ipz-22-4/petrov-denys/sekailib.git)
cd sekailib
docker compose up --build