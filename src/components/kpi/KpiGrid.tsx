import type { CatalogStats } from '@/types/catalog'
import { PREMIUM_THRESHOLD } from '@/services/catalogStats'
import { formatCount, formatNumber, formatOptionalCurrency, formatPercent } from '@/utils/format'
import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import { KpiCard } from './KpiCard'
import styles from './KpiGrid.module.css'

interface KpiGridProps {
  stats: CatalogStats
  isFiltered: boolean
}

export function KpiGrid({ stats, isFiltered }: KpiGridProps) {
  const { priciest } = stats
  const { openDetail } = useProductDetail()

  return (
    <div className={styles.grid}>
      <KpiCard
        icon="sim"
        label="Cartes eSIM"
        onSelect={() => openDetail(selections.all())}
        value={formatNumber(stats.total)}
        hint={
          stats.zoneCount
            ? `${formatCount(stats.countryCount, 'pays', 'pays')} + ${formatCount(stats.zoneCount, 'zone')}`
            : `${formatCount(stats.countryCount, 'pays', 'pays')} couverts`
        }
      />
      <KpiCard
        icon="gem"
        label={`Produits > ${PREMIUM_THRESHOLD} €`}
        onSelect={() => openDetail(selections.premium())}
        value={formatNumber(stats.over100)}
        hint={`${formatPercent(stats.pricedCount ? stats.over100 / stats.pricedCount : 0)} des produits en €`}
      />
      <KpiCard
        icon="range"
        label="Fourchette de prix"
        onSelect={() => openDetail(selections.priced())}
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
        onSelect={() => openDetail(selections.withData())}
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
        onSelect={() => openDetail(selections.priced())}
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
