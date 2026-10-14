import type { CatalogStats, Product } from '@/types/catalog'
import { ActiveFilter } from '@/components/filters/ActiveFilter'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { ProviderChart } from '@/components/charts/ProviderChart'
import { PriceDistributionChart } from '@/components/charts/PriceDistributionChart'
import { DataTiersChart } from '@/components/charts/DataTiersChart'
import { DestinationComparator } from '@/components/charts/DestinationComparator'
import { PriceIndexChart } from '@/components/charts/PriceIndexChart'
import { PricePerGbRanking } from '@/components/insights/PricePerGbRanking'
import { TopDestinations } from '@/components/insights/TopDestinations'
import { CatalogFeatures } from '@/components/insights/CatalogFeatures'
import { CatalogExtremes } from '@/components/insights/CatalogExtremes'
import { ExcludedPricesNotice } from '@/components/insights/ExcludedPricesNotice'
import styles from './sections.module.css'

interface StatisticsSectionProps {
  products: Product[]
  stats: CatalogStats
  globalStats: CatalogStats
  provider: string | null
  onProviderChange: (provider: string | null) => void
  onProviderToggle: (provider: string) => void
  onShowQuality: () => void
}

export function StatisticsSection({
  products,
  stats,
  globalStats,
  provider,
  onProviderChange,
  onProviderToggle,
  onShowQuality,
}: StatisticsSectionProps) {
  return (
    <>
      {provider && <ActiveFilter label={provider} onClear={() => onProviderChange(null)} />}
      <ExcludedPricesNotice excluded={stats.excludedFromPrices} onShowDetails={onShowQuality} />

      <KpiGrid stats={stats} isFiltered={provider !== null} />

      <div className={styles.grid}>
        {/* Vues comparatives : toujours sur le catalogue complet, le fournisseur actif est mis en évidence. */}
        <ProviderChart data={globalStats.byProvider} selected={provider} onSelect={onProviderToggle} />
        <DestinationComparator products={products} highlightedProvider={provider} />
        <PriceDistributionChart data={stats.priceDistribution} />
        <DataTiersChart data={stats.dataTiers} />
        <PricePerGbRanking providers={globalStats.byProvider} selected={provider} onSelect={onProviderToggle} />
        <PriceIndexChart providers={globalStats.byProvider} selected={provider} onSelect={onProviderToggle} />
        <TopDestinations countries={stats.topCountries} />
        <CatalogFeatures
          share5G={stats.share5G}
          shareTopUp={stats.shareTopUp}
          shareUnlimited={stats.shareUnlimited}
          validity={stats.validity}
        />
        <CatalogExtremes cheapest={stats.cheapest} priciest={stats.priciest} />
      </div>
    </>
  )
}
