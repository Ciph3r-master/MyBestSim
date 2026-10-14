import type { ReactNode } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Icon, type IconName } from '@/components/ui/Icon'
import styles from './KpiCard.module.css'

interface KpiCardProps {
  icon: IconName
  label: string
  value: ReactNode
  hint?: ReactNode
}

export function KpiCard({ icon, label, value, hint }: KpiCardProps) {
  return (
    <GlassCard interactive className={styles.card}>
      <div className={styles.head}>
        <span className={styles.icon}>
          <Icon name={icon} />
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </GlassCard>
  )
}
