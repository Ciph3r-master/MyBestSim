import type { CountItem } from '@/types/catalog'
import { formatNumber } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { RankingList } from '@/components/ui/RankingList'
import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import styles from './TopDestinations.module.css'

interface TopDestinationsProps {
  countries: CountItem[]
  zones: CountItem[]
  /** Ouvre le contrôle qualité qui explique comment les zones sont détectées. */
  onShowDetails: () => void
}

const toItems = (list: CountItem[]) =>
  list.map((c) => ({ id: c.name, label: c.name, value: c.count, display: formatNumber(c.count) }))

/**
 * Pays et zones sont classés séparément : une zone (Europe, Monde…) regroupe de nombreux pays
 * et écraserait sinon le classement.
 */
export function TopDestinations({ countries, zones, onShowDetails }: TopDestinationsProps) {
  const { openDetail } = useProductDetail()
  const showDestination = (name: string) => openDetail(selections.destination(name))
  return (
    <Panel title="Destinations" subtitle="Nombre d’offres par destination · pays et zones séparés · cliquez pour le détail">
      <h3 className={styles.heading}>Pays les plus couverts</h3>
      <RankingList items={toItems(countries)} variant="teal" onSelect={showDestination} />
      {zones.length > 0 && (
        <>
          <h3 className={styles.heading}>Zones multi-pays</h3>
          <RankingList items={toItems(zones)} onSelect={showDestination} />
          <p className={styles.note}>
            Destinations non reconnues comme pays ISO 3166, détectées automatiquement.{' '}
            <button type="button" className={styles.link} onClick={onShowDetails}>
              Voir le détail dans l’onglet Qualité →
            </button>
          </p>
        </>
      )}
    </Panel>
  )
}
