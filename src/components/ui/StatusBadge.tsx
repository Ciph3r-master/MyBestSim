import type { QualityStatus } from '@/types/quality'
import { STATUS_META } from '@/constants/quality'
import { Icon } from './Icon'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: QualityStatus
  /** Affiche uniquement l'icône (le libellé reste accessible aux lecteurs d'écran). */
  compact?: boolean
}

export function StatusBadge({ status, compact = false }: StatusBadgeProps) {
  const { label, icon } = STATUS_META[status]
  return (
    <span className={`${styles.badge} ${styles[status]} ${compact ? styles.compact : ''}`} title={label}>
      <Icon name={icon} size={13} />
      {compact ? <span className={styles.srOnly}>{label}</span> : label}
    </span>
  )
}
