import { useMemo } from 'react'
import type { Product } from '@/types/catalog'
import { computeStats } from '@/services/catalogStats'
import { formatCount, formatOptionalCurrency, formatPercent } from '@/utils/format'
import styles from './SelectionSummary.module.css'

/** Mini-statistiques de la sélection : les mêmes calculs que le dashboard, appliqués aux seuls produits listés. */
export function SelectionSummary({ products }: { products: Product[] }) {
  const stats = useMemo(() => computeStats(products), [products])
  if (products.length === 0) return null

  const excluded = stats.excludedFromPrices.reduce((n, c) => n + c.count, 0)
  const items = [
    { label: 'Fournisseurs', value: String(stats.byProvider.length) },
    { label: 'Prix min.', value: formatOptionalCurrency(stats.minPrice) },
    { label: 'Prix médian', value: formatOptionalCurrency(stats.medianPrice) },
    { label: 'Prix max.', value: formatOptionalCurrency(stats.maxPrice) },
    { label: 'Prix moyen / Go', value: formatOptionalCurrency(stats.avgPricePerGb) },
    { label: '5G', value: formatPercent(stats.share5G) },
  ]

  return (
    <section className={styles.summary} aria-label="Résumé de la sélection">
      <dl className={styles.grid}>
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      {excluded > 0 && (
        <p className={styles.note}>
          {formatCount(excluded, 'produit hors EUR exclu', 'produits hors EUR exclus')} des indicateurs de prix ci-dessus.
        </p>
      )}
    </section>
  )
}
