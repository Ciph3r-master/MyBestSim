import type { KeyboardEvent, ReactNode } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Icon, type IconName } from '@/components/ui/Icon'
import styles from './KpiCard.module.css'

interface KpiCardProps {
  icon: IconName
  label: string
  value: ReactNode
  hint?: ReactNode
  /** Rend la carte activable : ouvre le détail des produits concernés. */
  onSelect?: () => void
}

export function KpiCard({ icon, label, value, hint, onSelect }: KpiCardProps) {
  // La carte contient des blocs (div) : on utilise role="button" plutôt qu'un <button>, avec le clavier géré.
  const action = onSelect && {
    role: 'button',
    tabIndex: 0,
    'aria-label': `${label} : voir les produits`,
    onClick: onSelect,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect()
      }
    },
  }

  return (
    <GlassCard interactive className={`${styles.card} ${onSelect ? styles.clickable : ''}`} {...action}>
      <div className={styles.head}>
        <span className={styles.icon}>
          <Icon name={icon} />
        </span>
        <span className={styles.label}>{label}</span>
        {onSelect && (
          <span className={styles.more} aria-hidden>
            <Icon name="chevron" size={14} />
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </GlassCard>
  )
}
