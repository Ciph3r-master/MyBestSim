import { CatalogProvider } from '@/contexts/CatalogProvider'
import { Background } from '@/components/layout/Background'
import { DropOverlay } from '@/components/import/DropOverlay'
import { DashboardPage } from '@/pages/DashboardPage'

export default function App() {
  return (
    <CatalogProvider>
      <Background />
      <DashboardPage />
      <DropOverlay />
    </CatalogProvider>
  )
}
