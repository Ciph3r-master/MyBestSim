import { useMemo, useState } from 'react'
import { LazyRender } from '@/components/ui/LazyRender'
import type { Product } from '@/types/catalog'
import { COLORS } from '@/constants/theme'
import { ComparatorPlot } from './lazyPlots'
import type { ComparatorPoint } from './plots/ComparatorPlot'
import { compareOffers, listDestinations, listValidities, type ComparedOffer } from '@/services/offerComparison'
import { formatCount, formatCurrency, formatSignedPercent } from '@/utils/format'
import { useProductDetail } from '@/hooks/useProductDetail'
import { useSyncUrlParam } from '@/hooks/useUrlState'
import { readUrlParam } from '@/utils/urlState'
import { selections } from '@/services/selections'
import { Panel } from '@/components/ui/Panel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import styles from './DestinationComparator.module.css'

interface DestinationComparatorProps {
  products: Product[]
  /** Fournisseur filtré dans le dashboard : ses offres sont mises en évidence. */
  highlightedProvider: string | null
}

const PREFERRED_DESTINATION = 'France'
const DEFAULT_VALIDITY = 30
const PLOT_HEIGHT = 340

/** Décalage horizontal stable (dérivé du SKU) pour que les points d'une même enveloppe ne se superposent pas. */
function jitter(sku: string): number {
  let h = 0
  for (const c of sku) h = (h * 31 + c.charCodeAt(0)) | 0
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.5
}

export function DestinationComparator({ products, highlightedProvider }: DestinationComparatorProps) {
  const { openDetail } = useProductDetail()
  const destinations = useMemo(() => listDestinations(products), [products])
  const validities = useMemo(() => listValidities(products), [products])

  // Destination et durée choisies : initialisées depuis l'URL, et recopiées dans l'URL quand elles sont valides.
  const [destinationChoice, setDestination] = useState<string | null>(() => readUrlParam('destination'))
  // Toujours à durée égale : mélanger 7 et 30 jours ferait passer un forfait court pour une « bonne affaire ».
  const [validity, setValidity] = useState<number>(() => Number(readUrlParam('validity')) || DEFAULT_VALIDITY)

  // Le choix est conservé tant qu'il existe dans le catalogue chargé (imports successifs).
  const destination =
    destinations.find((d) => d.name === destinationChoice)?.name ??
    destinations.find((d) => d.name === PREFERRED_DESTINATION)?.name ??
    destinations[0]?.name ??
    null
  const activeValidity = validities.includes(validity) ? validity : (validities[validities.length - 1] ?? null)

  useSyncUrlParam('destination', destination === destinationChoice ? destination : null)
  useSyncUrlParam('validity', activeValidity != null && activeValidity !== DEFAULT_VALIDITY ? String(activeValidity) : null)

  const comparison = useMemo(
    () => (destination ? compareOffers(products, destination, activeValidity) : null),
    [products, destination, activeValidity],
  )

  if (!destination || !comparison) {
    return (
      <Panel title="Comparateur par destination" wide>
        <PanelEmpty>Aucun produit en EUR à comparer.</PanelEmpty>
      </Panel>
    )
  }

  const bestSkus = new Set(comparison.best.map((b) => b.product.sku))
  const toPoint = (offer: ComparedOffer): ComparatorPoint => ({
    x: offer.tierIndex + (bestSkus.has(offer.product.sku) ? 0 : jitter(offer.product.sku)),
    y: offer.product.price,
    offer,
    provider: offer.product.provider,
  })
  const isHighlighted = (o: ComparedOffer) => o.product.provider === highlightedProvider
  const others = comparison.offers.filter((o) => !bestSkus.has(o.product.sku) && !isHighlighted(o)).map(toPoint)
  const highlighted = comparison.offers.filter((o) => !bestSkus.has(o.product.sku) && isHighlighted(o)).map(toPoint)
  const best = comparison.best.map(toPoint)
  const providerCount = new Set(comparison.offers.map((o) => o.product.provider)).size

  return (
    <Panel
      title="Comparateur par destination"
      subtitle="Chaque point est une offre en EUR, à durée égale · la meilleure offre de chaque volume est mise en évidence · cliquez sur un point pour sa fiche"
      wide
    >
      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Destination</span>
          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
            {[
              { label: 'Pays', items: destinations.filter((d) => d.isCountry) },
              { label: 'Zones multi-pays', items: destinations.filter((d) => !d.isCountry) },
            ]
              .filter((group) => group.items.length > 0)
              .map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name} · {d.count}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </label>
        <SegmentedControl
          label="Durée de validité"
          options={validities.map((v) => ({ value: v, label: `${v} jours` }))}
          value={activeValidity}
          onChange={(v) => v != null && setValidity(v)}
          classNames={{ group: styles.segmented, option: styles.segment, active: styles.segmentActive }}
        />
        <p className={styles.summary}>
          {formatCount(comparison.offers.length, 'offre')} · {formatCount(providerCount, 'fournisseur')}
        </p>
      </div>

      {comparison.offers.length === 0 ? (
        <PanelEmpty>Aucune offre pour cette destination et cette durée.</PanelEmpty>
      ) : (
        <>
          <div className={styles.legend} aria-hidden>
            <span><i style={{ background: COLORS.best }} /> Meilleure offre du volume</span>
            {highlightedProvider && (
              <span><i style={{ background: COLORS.highlight }} /> {highlightedProvider}</span>
            )}
            <span><i style={{ background: COLORS.neutral }} /> Autres offres</span>
          </div>

          <LazyRender height={PLOT_HEIGHT}>
            <ComparatorPlot
              tiers={comparison.tiers}
              others={others}
              highlighted={highlighted}
              best={best}
              onPointClick={(point) => openDetail(selections.product(point.offer.product))}
              height={PLOT_HEIGHT}
            />
          </LazyRender>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>Meilleure offre par volume · {destination}{activeValidity ? ` · ${activeValidity} jours` : ''}</caption>
              <thead>
                <tr>
                  <th>Volume</th>
                  <th>Fournisseur</th>
                  <th className={styles.num}>Prix</th>
                  <th className={styles.num}>Prix / Go</th>
                  <th className={styles.num}>vs médiane</th>
                  <th className={styles.num}>Offres</th>
                </tr>
              </thead>
              <tbody>
                {comparison.best.map((b) => (
                  <tr key={b.tier} className={b.product.provider === highlightedProvider ? styles.highlightRow : ''}>
                    <td>{b.tier}</td>
                    <td>
                      <button type="button" className={styles.offerLink} onClick={() => openDetail(selections.product(b.product))}>
                        {b.product.provider}
                      </button>
                      <small>
                        {b.product.validityDays} j · {b.product.network}
                      </small>
                    </td>
                    <td className={styles.num}>{formatCurrency(b.product.price)}</td>
                    <td className={styles.num}>{b.pricePerGb == null ? '-' : formatCurrency(b.pricePerGb)}</td>
                    <td className={styles.num}>{formatSignedPercent(b.gapToMedian)}</td>
                    <td className={styles.num}>{b.offerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  )
}
