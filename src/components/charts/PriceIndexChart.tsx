import { LazyRender } from '@/components/ui/LazyRender'
import type { ProviderStat } from '@/types/catalog'
import { COLORS } from '@/constants/theme'
import { formatSignedPercent as signedPercent } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import { IndexPlot } from './lazyPlots'
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
  const plotHeight = Math.max(220, data.length * 24 + 40)
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
          <LazyRender height={plotHeight}>
            <IndexPlot
              data={data}
              bound={bound}
              ticks={ticks}
              tickDecimals={tickDecimals}
              selected={selected}
              onSelect={onSelect}
              height={plotHeight}
            />
          </LazyRender>
        </>
      )}
    </Panel>
  )
}
