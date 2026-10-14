import type { ProviderStat } from '@/types/catalog'
import { LazyRender } from '@/components/ui/LazyRender'
import { Panel } from '@/components/ui/Panel'
import { ProviderPlot } from './lazyPlots'

interface ProviderChartProps {
  data: ProviderStat[]
  selected: string | null
  onSelect: (provider: string) => void
}

const HEIGHT = 460

export function ProviderChart({ data, selected, onSelect }: ProviderChartProps) {
  return (
    <Panel
      title="Répartition par fournisseur"
      subtitle="Nombre de cartes proposées · cliquez sur une barre pour filtrer"
      wide
    >
      <LazyRender height={HEIGHT}>
        <ProviderPlot data={data} selected={selected} onSelect={onSelect} height={HEIGHT} />
      </LazyRender>
    </Panel>
  )
}
