import type { CatalogStats } from '@/types/catalog'
import { PREMIUM_THRESHOLD } from '@/services/catalogStats'
import { formatCount, formatNumber, formatOptionalCurrency, formatPercent } from '@/utils/format'
import { KpiCard } from './KpiCard'
import styles from './KpiGrid.module.css'

interface KpiGridProps {
  stats: CatalogStats
  isFiltered: boolean
}

export function KpiGrid({ stats, isFiltered }: KpiGridProps) {
  const { priciest } = stats

  return (
    <div className={styles.grid}>
      <KpiCard
        icon="sim"
        label="Cartes eSIM"
        value={formatNumber(stats.total)}
        hint={`${stats.countries} destinations couvertes`}
      />
      <KpiCard
        icon="gem"
        label={`Produits > ${PREMIUM_THRESHOLD} €`}
        value={formatNumber(stats.over100)}
        hint={`${formatPercent(stats.pricedCount ? stats.over100 / stats.pricedCount : 0)} des produits en €`}
      />
      <KpiCard
        icon="range"
        label="Fourchette de prix"
        value={
          <span className={styles.range}>
            {formatOptionalCurrency(stats.minPrice)} <em>→</em> {formatOptionalCurrency(stats.maxPrice)}
          </span>
        }
        hint={priciest && `Max : ${priciest.productName} (${priciest.provider})`}
      />
      <KpiCard
        icon="signal"
        label="Data moyenne / carte"
        value={`${formatNumber(stats.avgData, 1)} Go`}
        hint={[
          stats.medianData != null && `médiane ${formatNumber(stats.medianData)} Go`,
          stats.unlimited
            ? `hors ${formatCount(stats.unlimited, 'illimité', 'illimités')}`
            : 'aucun illimité',
        ]
          .filter(Boolean)
          .join(' · ')}
      />
      <KpiCard
        icon="euro"
        label="Prix moyen"
        value={formatOptionalCurrency(stats.avgPrice)}
        hint={
          stats.medianPrice == null
            ? 'aucun prix en €'
            : `médiane ${formatOptionalCurrency(stats.medianPrice)} · ${formatOptionalCurrency(stats.avgPricePerGb)}\u00a0/\u00a0Go en moyenne`
        }
      />
      <KpiCard
        icon="building"
        label="Fournisseurs"
        value={formatNumber(stats.byProvider.length)}
        hint={isFiltered ? 'filtre actif' : `leader : ${stats.byProvider[0]?.name ?? '-'}`}
      />
    </div>
  )
}
