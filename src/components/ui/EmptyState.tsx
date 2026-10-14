import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'
import { Icon, type IconName } from './Icon'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  icon: IconName
  title: string
  children?: ReactNode
}

export function EmptyState({ icon, title, children }: EmptyStateProps) {
  return (
    <GlassCard className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size={28} />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {children && <div className={styles.body}>{children}</div>}
    </GlassCard>
  )
}
