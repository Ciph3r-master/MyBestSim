import type { CatalogStats } from '@/types/catalog'
import type { ProductSelection } from '@/types/selection'
import { useProductDetail } from '@/hooks/useProductDetail'
import { selections } from '@/services/selections'
import { formatNumber } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { ProgressRing } from '@/components/ui/ProgressRing'
import styles from './CatalogFeatures.module.css'

type CatalogFeaturesProps = Pick<CatalogStats, 'share5G' | 'shareTopUp' | 'shareUnlimited' | 'validity'>

export function CatalogFeatures({ share5G, shareTopUp, shareUnlimited, validity }: CatalogFeaturesProps) {
  const { openDetail } = useProductDetail()
  const rings: { value: number; label: string; selection: ProductSelection }[] = [
    { value: share5G, label: 'Compatibles 5G', selection: selections.network('5G') },
    { value: shareTopUp, label: 'Rechargeables', selection: selections.topUp() },
    { value: shareUnlimited, label: 'Illimités', selection: selections.dataTier('Illimité') },
  ]

  return (
    <Panel title="Caractéristiques" subtitle="Réseau, recharge et durée de validité · cliquez pour le détail">
      <div className={styles.rings}>
        {rings.map((ring) => (
          <button key={ring.label} type="button" className={styles.action} onClick={() => openDetail(ring.selection)}>
            <ProgressRing value={ring.value} label={ring.label} />
          </button>
        ))}
      </div>
      <div className={styles.validity}>
        {validity.map((v) => (
          <button
            key={v.name}
            type="button"
            className={`${styles.chip} ${styles.action}`}
            onClick={() => openDetail(selections.validity(parseInt(v.name, 10)))}
          >
            <strong>{formatNumber(v.count)}</strong>
            <span>{v.name}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}
