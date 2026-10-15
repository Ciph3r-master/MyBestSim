import { useUrlState } from '@/hooks/useUrlState'
import { useCatalog } from '@/hooks/useCatalog'
import { useCatalogDashboard } from '@/hooks/useCatalogDashboard'
import { formatCount } from '@/utils/format'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Footer } from '@/components/layout/Footer'
import { ProviderSelect } from '@/components/filters/ProviderSelect'
import { ProviderFilter } from '@/components/filters/ProviderFilter'
import { DataSourceBar } from '@/components/import/DataSourceBar'
import { ImportNotice } from '@/components/import/ImportNotice'
import { EmptyState } from '@/components/ui/EmptyState'
import { FILES_PANEL_ID } from '@/components/quality/FileQualityTable'
import { ProductDetailProvider } from '@/contexts/ProductDetailProvider'
import { Icon } from '@/components/ui/Icon'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { tabPanelProps } from '@/components/ui/tabPanelProps'
import { StatisticsSection } from './sections/StatisticsSection'
import { DataQualitySection } from './sections/DataQualitySection'
import { ChangesSection } from './sections/ChangesSection'
import { countChanges } from '@/services/catalogDiff'
import styles from './DashboardPage.module.css'

type View = 'stats' | 'quality' | 'changes'

export function DashboardPage() {
  // Onglet actif partagé dans l'URL (?view=quality). Les changements d'un import n'existent que dans
  // ce navigateur et cette session : cet onglet n'est donc pas mis dans un lien partageable.
  const [selectedView, setView] = useUrlState<View>(
    'view',
    (raw) => (raw === 'quality' ? 'quality' : 'stats'),
    (v) => (v === 'quality' ? 'quality' : null),
  )

  /** Ouvre l'onglet Qualité et, si une ancre est donnée, fait défiler jusqu'à l'élément visé. */
  const showQuality = (anchor?: string) => {
    setView('quality')
    if (!anchor) return
    // L'élément n'existe qu'après le rendu de l'onglet : on attend la frame suivante.
    requestAnimationFrame(() => {
      const target = document.getElementById(anchor)
      if (!target) return
      target.scrollIntoView({ block: 'center' })
      // Brève mise en évidence de l'élément visé (sans toucher à l'URL).
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        target.animate(
          [{ boxShadow: '0 0 0 2px var(--teal)' }, { boxShadow: '0 0 0 2px var(--teal)', offset: 0.6 }, { boxShadow: '0 0 0 0 transparent' }],
          { duration: 1600, easing: 'ease-out' },
        )
      }
    })
  }

  const { isDefault, importedFiles, lastChanges } = useCatalog()
  const changes = lastChanges?.diff.hasChanges ? lastChanges : null
  const view: View = selectedView === 'changes' && !changes ? 'stats' : selectedView
  const { catalog, provider, setProvider, toggleProvider, stats, globalStats, qualityReport, scopedProducts } =
    useCatalogDashboard()

  const alerts = qualityReport.counts.warning + qualityReport.counts.error
  const tabs: TabItem<View>[] = [
    { id: 'stats', label: 'Statistiques', icon: <Icon name="chart" size={16} /> },
    {
      id: 'quality',
      label: 'Qualité des données',
      icon: <Icon name="shield" size={16} />,
      badge: alerts > 0 && <span className={styles.tabBadge}>{alerts}</span>,
    },
    ...(changes
      ? [
          {
            id: 'changes' as const,
            label: 'Changements',
            icon: <Icon name="upload" size={16} />,
            badge: <span className={styles.tabBadgeInfo}>{countChanges(changes.diff)}</span>,
          },
        ]
      : []),
  ]

  return (
    <ProductDetailProvider products={scopedProducts} marketProducts={catalog.products} scopeLabel={provider}>
      <main className={styles.page}>
        <DashboardHeader
          eyebrow="MyBestSim · Catalogue eSIM"
          title="Tableau de bord produits"
          description={`${formatCount(catalog.products.length, 'produit lu', 'produits lus')} automatiquement depuis ${formatCount(catalog.fileCount, 'fichier CSV fournisseur', 'fichiers CSV fournisseurs')}`}
          actions={
            view === 'stats' && <ProviderSelect providers={catalog.providers} value={provider} onChange={setProvider} />
          }
        />

        <DataSourceBar onManageFiles={() => showQuality(FILES_PANEL_ID)} />
        <ImportNotice
          qualityAlerts={alerts}
          onShowQuality={() => showQuality()}
          onShowChanges={() => setView('changes')}
        />

        <div className={styles.toolbar}>
          <Tabs label="Vue du dashboard" idPrefix="view" items={tabs} value={view} onChange={setView} />
          {view === 'stats' && provider && <ProviderFilter provider={provider} onClear={() => setProvider(null)} />}
        </div>

        <div {...tabPanelProps('view', view)} className={styles.panel}>
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
            onProviderToggle={toggleProvider}
            onShowQuality={showQuality}
          />
        ) : view === 'changes' && changes ? (
          <ChangesSection changes={changes} />
        ) : (
          <DataQualitySection report={qualityReport} />
        )}
        </div>

        <Footer>
          Prix en EUR · « Data moyenne » calculée sur les forfaits à volume fixe (les illimités n'ont pas de valeur en Go)
          · Données : {catalog.fileCount} CSV{' '}
          {isDefault ? 'fournisseurs MyBestSim' : `(dont ${formatCount(importedFiles.length, 'importé')} dans le navigateur)`}
        </Footer>
      </main>
    </ProductDetailProvider>
  )
}
