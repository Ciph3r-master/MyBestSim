import { CatalogProvider } from '@/contexts/CatalogProvider'
import { Background } from '@/components/layout/Background'
import { DropOverlay } from '@/components/import/DropOverlay'
import { DashboardPage } from '@/pages/DashboardPage'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function App() {
  return (
    <CatalogProvider>
      <Background />
      <ErrorBoundary variant="page">
        <DashboardPage />
      </ErrorBoundary>
      <DropOverlay />
    </CatalogProvider>
  )
}
