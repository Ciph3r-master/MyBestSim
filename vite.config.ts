import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Les services sont des fonctions pures : l'environnement Node suffit (Intl et File y sont disponibles).
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  build: {
    // Le chunk vendor (React + Recharts) pèse ~180 kB gzip, acceptable pour un dashboard.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Librairies dans un chunk séparé : mieux mis en cache entre deux mises à jour des données.
        codeSplitting: { groups: [{ name: 'vendor', test: /node_modules/ }] },
      },
    },
  },
})
