# Використовуємо офіційний образ Playwright
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app
COPY package*.json ./
RUN npm install
# ОБОВ'ЯЗКОВО встановлюємо браузери всередині образу
RUN npx playwright install chromium --with-deps

COPY . .
CMD ["npx", "playwright", "test"]