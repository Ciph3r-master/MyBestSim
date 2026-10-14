import type { CountItem } from '@/types/catalog'
import { BASE_CURRENCY } from '@/constants/catalog'
import { formatCount, formatNumber } from '@/utils/format'
import { Callout } from '@/components/ui/Callout'

interface ExcludedPricesNoticeProps {
  excluded: CountItem[]
  onShowDetails: () => void
}

/** Signale les produits hors devise de référence, exclus des indicateurs de prix. */
export function ExcludedPricesNotice({ excluded, onShowDetails }: ExcludedPricesNoticeProps) {
  const total = excluded.reduce((n, c) => n + c.count, 0)
  if (total === 0) return null

  return (
    <Callout tone="warning" icon="alert">
      <p>
        <strong>
          {formatCount(total, 'produit exclu', 'produits exclus')} des indicateurs de prix
        </strong>{' '}
        ({excluded.map((c) => `${c.name} : ${formatNumber(c.count)}`).join(', ')}) : prix non exprimés en {BASE_CURRENCY}, non
        convertis. Ils restent comptés dans les volumes (cartes, fournisseurs, data, destinations).{' '}
        <button type="button" onClick={onShowDetails}>
          Voir le détail
        </button>
      </p>
    </Callout>
  )
}
