import type { CountItem } from '@/types/catalog'
import { COLORS } from '@/constants/theme'
import { PREMIUM_THRESHOLD } from '@/services/catalogStats'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import { ColumnChart } from './ColumnChart'

export function PriceDistributionChart({ data }: { data: CountItem[] }) {
  return (
    <Panel title="Distribution des prix" subtitle="Nombre de produits par tranche de prix (€)">
      {data.some((d) => d.count > 0) ? (
        <ColumnChart
          data={data}
          colorFor={(name) => (name.startsWith(String(PREMIUM_THRESHOLD)) ? COLORS.pink : COLORS.teal)}
        />
      ) : (
        <PanelEmpty>Aucun produit en EUR : indicateur de prix indisponible.</PanelEmpty>
      )}
    </Panel>
  )
}
