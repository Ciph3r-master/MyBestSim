import { useState } from 'react'
import { useCatalog } from '@/hooks/useCatalog'
import { useCatalogDashboard } from '@/hooks/useCatalogDashboard'
import { formatCount } from '@/utils/format'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Footer } from '@/components/layout/Footer'
import { ProviderSelect } from '@/components/filters/ProviderSelect'
import { DataSourceBar } from '@/components/import/DataSourceBar'
import { ImportNotice } from '@/components/import/ImportNotice'
import { EmptyState } from '@/components/ui/EmptyState'
import { FILES_PANEL_ID } from '@/components/quality/FileQualityTable'
import { Icon } from '@/components/ui/Icon'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { StatisticsSection } from './sections/StatisticsSection'
import { DataQualitySection } from './sections/DataQualitySection'
import styles from './DashboardPage.module.css'

type View = 'stats' | 'quality'

// L'onglet actif est reflété dans l'URL (#qualite) pour pouvoir partager un lien direct.
const QUALITY_HASH = '#qualite'
const initialView = (): View => (window.location.hash === QUALITY_HASH ? 'quality' : 'stats')

export function DashboardPage() {
  const [view, setViewState] = useState<View>(initialView)

  const setView = (next: View) => {
    setViewState(next)
    const url = next === 'quality' ? QUALITY_HASH : window.location.pathname + window.location.search
    window.history.replaceState(null, '', url)
  }
  const { isDefault, importedFiles } = useCatalog()
  const { catalog, provider, setProvider, toggleProvider, stats, globalStats, qualityReport } = useCatalogDashboard()

  const alerts = qualityReport.counts.warning + qualityReport.counts.error
  const tabs: TabItem<View>[] = [
    { id: 'stats', label: 'Statistiques', icon: <Icon name="chart" size={16} /> },
    {
      id: 'quality',
      label: 'Qualité des données',
      icon: <Icon name="shield" size={16} />,
      badge: alerts > 0 && <span className={styles.tabBadge}>{alerts}</span>,
    },
  ]

  return (
    <main className={styles.page}>
      <DashboardHeader
        eyebrow="MyBestSim · Catalogue eSIM"
        title="Tableau de bord produits"
        description={`${formatCount(catalog.products.length, 'produit lu', 'produits lus')} automatiquement depuis ${formatCount(catalog.fileCount, 'fichier CSV fournisseur', 'fichiers CSV fournisseurs')}`}
        actions={
          view === 'stats' && <ProviderSelect providers={catalog.providers} value={provider} onChange={setProvider} />
        }
      />

      <DataSourceBar
        onManageFiles={() => {
          setView('quality')
          // Après le rendu de l'onglet qualité, fait défiler jusqu'au tableau des fichiers.
          requestAnimationFrame(() => document.getElementById(FILES_PANEL_ID)?.scrollIntoView({ block: 'start' }))
        }}
      />
      <ImportNotice qualityAlerts={alerts} onShowQuality={() => setView('quality')} />

      <Tabs label="Vue du dashboard" items={tabs} value={view} onChange={setView} />

      {view === 'stats' && catalog.products.length === 0 ? (
        <EmptyState icon="alert" title="Aucun produit exploitable">
          Les fichiers chargés ne contiennent aucune ligne valide. L’onglet{' '}
          <strong>Qualité des données</strong> détaille les problèmes détectés (colonnes manquantes, prix invalides…).
        </EmptyState>
      ) : view === 'stats' ? (
        <StatisticsSection
          products={catalog.products}
          stats={stats}
          globalStats={globalStats}
          provider={provider}
          onProviderChange={setProvider}
          onProviderToggle={toggleProvider}
          onShowQuality={() => setView('quality')}
        />
      ) : (
        <DataQualitySection report={qualityReport} />
      )}

      <Footer>
        Prix en EUR · « Data moyenne » calculée sur les forfaits à volume fixe (les illimités n'ont pas de valeur en Go)
        · Données : {catalog.fileCount} CSV{' '}
        {isDefault ? 'fournisseurs MyBestSim' : `(dont ${formatCount(importedFiles.length, 'importé')} dans le navigateur)`}
      </Footer>
    </main>
  )
}
