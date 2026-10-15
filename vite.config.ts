import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vitest/config'

/**
 * En développement, Vite renvoie la page d'accueil pour une URL de dossier du répertoire public
 * (« /article/ »). Un hébergeur statique sert, lui, « /article/index.html » : on reproduit ce comportement.
 */
function servePublicArticle(): Plugin {
  const middleware = (req: { url?: string }, res: { writeHead: (code: number, headers: Record<string, string>) => void; end: () => void }, next: () => void) => {
    // « /article » → redirection vers « /article/ », pour que les chemins relatifs (images/…) restent justes.
    if (req.url && /^\/article(\?.*)?$/.test(req.url)) {
      res.writeHead(301, { Location: req.url.replace(/^\/article/, '/article/') })
      res.end()
      return
    }
    if (req.url && /^\/article\/(\?.*)?$/.test(req.url)) req.url = req.url.replace(/^\/article\//, '/article/index.html')
    next()
  }
  return {
    name: 'serve-public-article',
    // Même règle en développement (npm run dev) et en prévisualisation du build (npm run preview).
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), servePublicArticle()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Les services sont des fonctions pures : l'environnement Node suffit (Intl et File y sont disponibles).
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  build: {
    // Le fichier des graphiques (Recharts) pèse ~130 kB gzip, chargé à la demande.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      // Deux pages : la page d'accueil (/) et le dashboard (/dashboard/). L'article est servi tel quel depuis public/article/.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./dashboard/index.html', import.meta.url)),
      },
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
