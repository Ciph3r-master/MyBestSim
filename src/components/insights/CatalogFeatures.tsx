import type { CatalogStats } from '@/types/catalog'
import { formatNumber } from '@/utils/format'
import { Panel } from '@/components/ui/Panel'
import { ProgressRing } from '@/components/ui/ProgressRing'
import styles from './CatalogFeatures.module.css'

type CatalogFeaturesProps = Pick<CatalogStats, 'share5G' | 'shareTopUp' | 'shareUnlimited' | 'validity'>

export function CatalogFeatures({ share5G, shareTopUp, shareUnlimited, validity }: CatalogFeaturesProps) {
  return (
    <Panel title="Caractéristiques" subtitle="Réseau, recharge et durée de validité">
      <div className={styles.rings}>
        <ProgressRing value={share5G} label="Compatibles 5G" />
        <ProgressRing value={shareTopUp} label="Rechargeables" />
        <ProgressRing value={shareUnlimited} label="Illimités" />
      </div>
      <div className={styles.validity}>
        {validity.map((v) => (
          <div key={v.name} className={styles.chip}>
            <strong>{formatNumber(v.count)}</strong>
            <span>{v.name}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
