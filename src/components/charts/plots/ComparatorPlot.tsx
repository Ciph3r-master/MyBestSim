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
import type { ComparedOffer } from '@/services/offerComparison'
import { AXIS_TICK, COLORS } from '@/constants/theme'
import { formatCurrency } from '@/utils/format'
import styles from '../DestinationComparator.module.css'

export interface ComparatorPoint {
  x: number
  y: number
  offer: ComparedOffer
  provider: string
}

export interface ComparatorPlotProps {
  tiers: string[]
  others: ComparatorPoint[]
  highlighted: ComparatorPoint[]
  best: ComparatorPoint[]
  onPointClick: (point: ComparatorPoint) => void
  height: number
}

function Dot({ cx, cy, fill, r }: { cx?: number; cy?: number; fill?: string; r: number }) {
  // Anneau de la couleur du fond : les points restent lisibles quand ils se chevauchent.
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={COLORS.surface} strokeWidth={2} />
}

function OfferTooltip({ active, payload }: Pick<TooltipContentProps<ValueType, NameType>, 'active' | 'payload'>) {
  const point = active ? (payload?.[0]?.payload as ComparatorPoint | undefined) : undefined
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

export function ComparatorPlot({ tiers, others, highlighted, best, onPointClick, height }: ComparatorPlotProps) {
  // Recharts transmet le point cliqué (avec ses données d'origine dans `payload`).
  const handleClick = (point: unknown) => {
    const payload = (point as { payload?: ComparatorPoint }).payload
    if (payload) onPointClick(payload)
  }

  return (
    <ResponsiveContainer width="100%" height={height} className={styles.chart}>
      <ScatterChart margin={{ top: 24, right: 24, bottom: 16, left: 0 }}>
        <CartesianGrid stroke={COLORS.grid} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[-0.5, tiers.length - 0.5]}
          ticks={tiers.map((_, i) => i)}
          // Libellés courts (« 10 », « ∞ ») : l'unité est portée par le titre de l'axe, les graduations tiennent sur mobile.
          tickFormatter={(i: number) => (tiers[i] ?? '').replace(/\s*Go$/, '').replace(/^Illimit.*/i, '∞')}
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
        <Scatter
          data={others}
          fill={COLORS.neutral}
          isAnimationActive={false}
          cursor="pointer"
          onClick={handleClick}
          shape={(p: object) => <Dot {...p} r={4.5} />}
        />
        <Scatter
          data={highlighted}
          fill={COLORS.highlight}
          isAnimationActive={false}
          cursor="pointer"
          onClick={handleClick}
          shape={(p: object) => <Dot {...p} r={5.5} />}
        />
        <Scatter
          data={best}
          fill={COLORS.best}
          isAnimationActive={false}
          cursor="pointer"
          onClick={handleClick}
          shape={(p: object) => <Dot {...p} r={7} />}
        >
          {/* Étiquette sélective : uniquement la meilleure offre de chaque volume. */}
          <LabelList dataKey="provider" position="top" offset={10} fill={COLORS.label} fontSize={11} />
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
