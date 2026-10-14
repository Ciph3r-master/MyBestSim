import type { CountItem } from '@/types/catalog'
import { COLORS } from '@/constants/theme'
import { PREMIUM_THRESHOLD } from '@/services/catalogStats'
import { Panel } from '@/components/ui/Panel'
import { PanelEmpty } from '@/components/ui/PanelEmpty'
import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import { ColumnChart } from './ColumnChart'

export function PriceDistributionChart({ data }: { data: CountItem[] }) {
  const { openDetail } = useProductDetail()
  return (
    <Panel title="Distribution des prix" subtitle="Nombre de produits par tranche de prix (€) · cliquez sur une tranche">
      {data.some((d) => d.count > 0) ? (
        <ColumnChart
          data={data}
          colorFor={(name) => (name.startsWith(String(PREMIUM_THRESHOLD)) ? COLORS.pink : COLORS.teal)}
          onSelect={(name) => openDetail(selections.priceBucket(name))}
        />
      ) : (
        <PanelEmpty>Aucun produit en EUR : indicateur de prix indisponible.</PanelEmpty>
      )}
    </Panel>
  )
}
