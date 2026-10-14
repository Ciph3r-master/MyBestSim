import type { CountItem } from '@/types/catalog'
import { formatNumber } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { RankingList } from '@/components/ui/RankingList'

export function TopDestinations({ countries }: { countries: CountItem[] }) {
  const items = countries.map((c) => ({ id: c.name, label: c.name, value: c.count, display: formatNumber(c.count) }))

  return (
    <Panel title="Top destinations" subtitle="Pays / zones les plus couverts">
      <RankingList items={items} variant="teal" />
    </Panel>
  )
}
