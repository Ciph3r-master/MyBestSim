import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'
import styles from './Panel.module.css'

interface PanelProps {
  /** Ancre pour y faire défiler la page. */
  id?: string
  title: string
  subtitle?: string
  wide?: boolean
  children: ReactNode
}

export function Panel({ id, title, subtitle, wide = false, children }: PanelProps) {
  return (
    <GlassCard as="section" id={id} className={`${styles.panel} ${wide ? styles.wide : ''}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>
      {children}
    </GlassCard>
  )
}
