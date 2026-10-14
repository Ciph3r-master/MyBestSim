import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  type TooltipContentProps,
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { Product } from '@/types/catalog'
import { AXIS_TICK, COLORS } from '@/constants/theme'
import { compareOffers, listDestinations, listValidities, type ComparedOffer } from '@/services/offerComparison'
import { formatCount, formatCurrency, formatSignedPercent } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import styles from './DestinationComparator.module.css'

interface DestinationComparatorProps {
  products: Product[]
  /** Fournisseur filtré dans le dashboard : ses offres sont mises en évidence. */
  highlightedProvider: string | null
}

interface Point {
  x: number
  y: number
  offer: ComparedOffer
  provider: string
}

const PREFERRED_DESTINATION = 'France'

/** Décalage horizontal stable (dérivé du SKU) pour que les points d'une même enveloppe ne se superposent pas. */
function jitter(sku: string): number {
  let h = 0
  for (const c of sku) h = (h * 31 + c.charCodeAt(0)) | 0
  return ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.5
}


function Dot({ cx, cy, fill, r }: { cx?: number; cy?: number; fill?: string; r: number }) {
  // Anneau de la couleur du fond : les points restent lisibles quand ils se chevauchent.
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={COLORS.surface} strokeWidth={2} />
}

function OfferTooltip({ active, payload }: Pick<TooltipContentProps<ValueType, NameType>, 'active' | 'payload'>) {
  const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined
  if (!point) return null
  const { product, pricePerGb } = point.offer
  return (
    <div className={styles.tooltip}>
      <strong>{product.provider}</strong>
      <span>{product.productName}</span>
      <span>
        {formatCurrency(product.price)}
        {pricePerGb != null && ` · ${formatCurrency(pricePerGb)}/Go`}
      </span>
      <small>
        {product.network} · {product.topUp ? 'rechargeable' : 'non rechargeable'}
      </small>
    </div>
  )
}

export function DestinationComparator({ products, highlightedProvider }: DestinationComparatorProps) {
  const destinations = useMemo(() => listDestinations(products), [products])
  const validities = useMemo(() => listValidities(products), [products])

  const [destinationChoice, setDestination] = useState<string | null>(null)
  // Toujours à durée égale : mélanger 7 et 30 jours ferait passer un forfait court pour une « bonne affaire ».
  const [validity, setValidity] = useState<number>(30)

  // Le choix est conservé tant qu'il existe dans le catalogue chargé (imports successifs).
  const destination =
    destinations.find((d) => d.name === destinationChoice)?.name ??
    destinations.find((d) => d.name === PREFERRED_DESTINATION)?.name ??
    destinations[0]?.name ??
    null
  const activeValidity = validities.includes(validity) ? validity : (validities[validities.length - 1] ?? null)

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
  const toPoint = (offer: ComparedOffer): Point => ({
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
      subtitle="Chaque point est une offre en EUR, à durée égale · la meilleure offre de chaque volume est mise en évidence"
      wide
    >
      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Destination</span>
          <select value={destination} onChange={(e) => setDestination(e.target.value)}>
            {destinations.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
                {d.isCountry ? '' : ' (zone)'} · {d.count}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.segmented} role="radiogroup" aria-label="Durée de validité">
          {validities.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={activeValidity === v}
              className={activeValidity === v ? styles.segmentActive : styles.segment}
              onClick={() => setValidity(v)}
            >
              {v} jours
            </button>
          ))}
        </div>
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

          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 24, right: 24, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={COLORS.grid} />
              <XAxis
                type="number"
                dataKey="x"
                domain={[-0.5, comparison.tiers.length - 0.5]}
                ticks={comparison.tiers.map((_, i) => i)}
                // Libellés courts (« 10 », « ∞ ») : l'unité est portée par le titre de l'axe, les graduations tiennent sur mobile.
                tickFormatter={(i: number) => (comparison.tiers[i] ?? '').replace(/\s*Go$/, '').replace(/^Illimit.*/i, '∞')}
                label={{ value: 'Volume (Go)', position: 'insideBottomRight', offset: -4, fill: COLORS.axis, fontSize: 11 }}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis
                type="number"
                dataKey="y"
                tickFormatter={(v: number) => `${v} €`}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              <ZAxis range={[64, 64]} />
              <Tooltip content={OfferTooltip} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
              <Scatter data={others} fill={COLORS.neutral} isAnimationActive={false} shape={(p: object) => <Dot {...p} r={4.5} />} />
              <Scatter
                data={highlighted}
                fill={COLORS.highlight}
                isAnimationActive={false}
                shape={(p: object) => <Dot {...p} r={5.5} />}
              />
              <Scatter data={best} fill={COLORS.best} isAnimationActive={false} shape={(p: object) => <Dot {...p} r={7} />}>
                {/* Étiquette sélective : uniquement la meilleure offre de chaque volume. */}
                <LabelList dataKey="provider" position="top" offset={10} fill={COLORS.label} fontSize={11} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

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
                      {b.product.provider}
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
