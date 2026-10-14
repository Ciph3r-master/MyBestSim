import type { ProviderStat } from '@/types/catalog'
import { formatCurrency } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { RankingList } from '@/components/ui/RankingList'
import { PanelEmpty } from '@/components/ui/PanelEmpty'

interface PricePerGbRankingProps {
  providers: ProviderStat[]
  selected: string | null
  onSelect: (provider: string) => void
}

export function PricePerGbRanking({ providers, selected, onSelect }: PricePerGbRankingProps) {
  // Un fournisseur sans forfait à volume fixe en € n'a pas de prix au Go : il n'est pas classé.
  const items = providers
    .flatMap((p) => (p.pricePerGb == null ? [] : [{ name: p.name, pricePerGb: p.pricePerGb }]))
    .sort((a, b) => a.pricePerGb - b.pricePerGb)
    .map((p) => ({ id: p.name, label: p.name, value: p.pricePerGb, display: formatCurrency(p.pricePerGb) }))

  return (
    <Panel
      title="Prix moyen au Go"
      subtitle="Par fournisseur (hors illimité) · dépend fortement de la part de gros forfaits : voir l'indice à offre égale"
    >
      {items.length ? (
        <RankingList items={items} activeId={selected} onSelect={onSelect} />
      ) : (
        <PanelEmpty>Aucun forfait à volume fixe en EUR : prix au Go indisponible.</PanelEmpty>
      )}
    </Panel>
  )
}
