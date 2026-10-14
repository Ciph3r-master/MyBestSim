import type { CatalogStats, Product } from '@/types/catalog'
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
import { qualityCheckAnchor } from '@/constants/quality'
import styles from './sections.module.css'

interface StatisticsSectionProps {
  products: Product[]
  stats: CatalogStats
  globalStats: CatalogStats
  provider: string | null
  onProviderToggle: (provider: string) => void
  /** Ouvre l'onglet Qualité, éventuellement sur un élément précis (ancre). */
  onShowQuality: (anchor?: string) => void
}

export function StatisticsSection({
  products,
  stats,
  globalStats,
  provider,
  onProviderToggle,
  onShowQuality,
}: StatisticsSectionProps) {
  return (
    <>
      <ExcludedPricesNotice
        excluded={stats.excludedFromPrices}
        onShowDetails={() => onShowQuality(qualityCheckAnchor('currency'))}
      />

      <KpiGrid stats={stats} isFiltered={provider !== null} />

      <div className={styles.grid}>
        {/* Vues comparatives : toujours sur le catalogue complet, le fournisseur actif est mis en évidence. */}
        <ProviderChart data={globalStats.byProvider} selected={provider} onSelect={onProviderToggle} />
        <DestinationComparator products={products} highlightedProvider={provider} />
        <PriceDistributionChart data={stats.priceDistribution} />
        <DataTiersChart data={stats.dataTiers} />
        <PricePerGbRanking providers={globalStats.byProvider} selected={provider} onSelect={onProviderToggle} />
        <PriceIndexChart providers={globalStats.byProvider} selected={provider} onSelect={onProviderToggle} />
        <TopDestinations
          countries={stats.topCountries}
          zones={stats.zones}
          onShowDetails={() => onShowQuality(qualityCheckAnchor('non-country-destinations'))}
        />
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
