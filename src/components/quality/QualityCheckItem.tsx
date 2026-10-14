import type { QualityCheck } from '@/types/quality'
import { formatNumber } from '@/utils/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { qualityCheckAnchor } from '@/constants/quality'
import styles from './QualityCheckItem.module.css'

export function QualityCheckItem({ check }: { check: QualityCheck }) {
  const examples = check.examples ?? []
  const remaining = (check.exampleCount ?? examples.length) - examples.length

  return (
    <li id={qualityCheckAnchor(check.id)} className={`${styles.item} ${styles[check.status]}`}>
      <div className={styles.head}>
        <StatusBadge status={check.status} compact />
        <h3 className={styles.label}>{check.label}</h3>
        <span className={styles.value}>{check.value}</span>
      </div>
      <p className={styles.detail}>{check.detail}</p>
      {examples.length > 0 && (
        <details className={styles.examples}>
          <summary>
            Voir {examples.length > 1 ? 'les exemples' : "l'exemple"}
            {remaining > 0 && ` (${examples.length} sur ${formatNumber(examples.length + remaining)})`}
          </summary>
          <ul>
            {examples.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}
