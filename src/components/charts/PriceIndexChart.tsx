import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ProviderStat } from '@/types/catalog'
import { AXIS_TICK, COLORS, TOOLTIP_PROPS } from '@/constants/theme'
import { formatSignedPercent as signedPercent } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import { coloredBar } from './barShape'
import styles from './PriceIndexChart.module.css'

interface PriceIndexChartProps {
  providers: ProviderStat[]
  selected: string | null
  onSelect: (provider: string) => void
}

/** En deçà de cet écart, les différences entre fournisseurs relèvent du bruit et non d'une politique tarifaire. */
const STRUCTURAL_GAP = 0.03

export function PriceIndexChart({ providers, selected, onSelect }: PriceIndexChartProps) {
  const data = providers
    .flatMap((p) => (p.priceIndex == null ? [] : [{ name: p.name, index: p.priceIndex }]))
    .sort((a, b) => a.index - b.index)

  const extent = Math.max(...data.map((d) => Math.abs(d.index)), 0.01)
  // Domaine symétrique : le zéro (prix médian du marché) reste au centre.
  const bound = Math.ceil(extent * 100) / 100
  // Graduations explicites et assez de décimales pour qu'elles restent distinctes sur une petite échelle.
  const ticks = [-bound, -bound / 2, 0, bound / 2, bound]
  const tickDecimals = bound < 0.05 ? 1 : 0
  const spread = data.length ? data[data.length - 1].index - data[0].index : 0

  return (
    <Panel
      title="Indice de prix à offre égale"
      subtitle="Écart moyen à la médiane des offres comparables (même volume, même durée, pays ou zone)"
    >
      {data.length === 0 ? (
        <PanelEmpty>Aucun produit en EUR : indice indisponible.</PanelEmpty>
      ) : (
        <>
          <p className={styles.verdict}>
            {spread < STRUCTURAL_GAP ? (
              <>
                <strong>Aucun écart structurel :</strong> tous les fournisseurs sont entre {signedPercent(data[0].index, 1)} et{' '}
                {signedPercent(data[data.length - 1].index, 1)} du marché. Les écarts du prix moyen au Go viennent de la
                composition des catalogues (part de gros forfaits), pas des tarifs.
              </>
            ) : (
              <>
                <strong>{data[0].name}</strong> est le moins cher à offre égale ({signedPercent(data[0].index, 1)}),{' '}
                <strong>{data[data.length - 1].name}</strong> le plus cher ({signedPercent(data[data.length - 1].index, 1)}).
              </>
            )}
          </p>
          <div className={styles.legend} aria-hidden>
            <span><i style={{ background: COLORS.cheaper }} /> moins cher que le marché</span>
            <span><i style={{ background: COLORS.pricier }} /> plus cher</span>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(220, data.length * 24 + 40)}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={COLORS.grid} />
              <XAxis
                type="number"
                domain={[-bound, bound]}
                ticks={ticks}
                tickFormatter={(v: number) => signedPercent(v, tickDecimals)}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis type="category" dataKey="name" width={96} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.35)" />
              <Tooltip {...TOOLTIP_PROPS} formatter={(v) => [signedPercent(Number(v), 2), 'vs médiane du marché']} />
              <Bar
                dataKey="index"
                isAnimationActive={false}
                radius={4}
                maxBarSize={16}
                cursor="pointer"
                onClick={(entry) => onSelect((entry as unknown as { name: string }).name)}
                shape={coloredBar((name) => {
                  const d = data.find((x) => x.name === name)
                  return {
                    fill: (d?.index ?? 0) <= 0 ? COLORS.cheaper : COLORS.pricier,
                    fillOpacity: !selected || selected === name ? 0.95 : 0.3,
                  }
                })}
              />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Panel>
  )
}
