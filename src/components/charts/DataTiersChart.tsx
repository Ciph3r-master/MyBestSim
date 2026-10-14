import type { CountItem } from '@/types/catalog'
import { Panel } from '@/components/ui/Panel'
import { ColumnChart } from './ColumnChart'

export function DataTiersChart({ data }: { data: CountItem[] }) {
  return (
    <Panel title="Volumes de data" subtitle="Répartition des forfaits par enveloppe">
      <ColumnChart data={data} />
    </Panel>
  )
}
