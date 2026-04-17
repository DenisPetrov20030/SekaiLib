# Етап збірки (Build Stage)
FROM node:20-alpine AS build
WORKDIR /app

# Копіюємо файли залежностей
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо всі файли проекту (включаючи src, public, vite.config.ts)
COPY . .

# Збираємо проект (Vite згенерує папку dist)
RUN npm run build

# Етап запуску (Production Stage)
# Використовуємо легкий Nginx для роздачі статичних файлів
FROM nginx:stable-alpine

# Копіюємо зібрані файли з попереднього етапу в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Відкриваємо 80 порт
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]