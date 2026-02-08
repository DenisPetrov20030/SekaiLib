import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Встановлюємо потрібний вам порт
    strictPort: true, // Рекомендую додати це, щоб Vite не перемикався на інший порт, якщо 5174 зайнятий
  },
})
