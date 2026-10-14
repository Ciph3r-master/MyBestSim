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
    // Le fichier des graphiques (Recharts) pèse ~130 kB gzip, chargé à la demande.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Recharts et ses dépendances dans un fichier à part, chargé seulement quand un graphique s'affiche
        // (voir src/components/charts/lazyPlots.ts) ; les autres librairies (React, PapaParse) dans « vendor »,
        // mieux mis en cache entre deux mises à jour des données.
        codeSplitting: {
          // Sans cela, un groupe embarque aussi les dépendances de ses modules : React finirait avec Recharts.
          includeDependenciesRecursively: false,
          groups: [
            {
              name: 'charts',
              test: /node_modules[\\/](recharts|victory-vendor|d3-[a-z-]+|internmap|@reduxjs|redux|react-redux|immer|reselect|es-toolkit|decimal\.js-light|eventemitter3|tiny-invariant|use-sync-external-store|clsx)[\\/]/,
              priority: 2,
            },
            { name: 'vendor', test: /node_modules/, priority: 1 },
          ],
        },
      },
    },
  },
})
