import type { CountItem } from '@/types/catalog'
import { Panel } from '@/components/ui/Panel'
import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import { ColumnChart } from './ColumnChart'

export function DataTiersChart({ data }: { data: CountItem[] }) {
  const { openDetail } = useProductDetail()
  return (
    <Panel title="Volumes de data" subtitle="Répartition des forfaits par enveloppe · cliquez sur un volume">
      <ColumnChart data={data} onSelect={(name) => openDetail(selections.dataTier(name))} />
    </Panel>
  )
}
