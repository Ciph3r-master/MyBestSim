import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'
import styles from './Tabs.module.css'

export interface TabItem<T extends string> {
  id: T
  label: string
  icon?: ReactNode
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}

export function Tabs<T extends string>({ items, value, onChange, label }: TabsProps<T>) {
  return (
    <GlassCard role="tablist" aria-label={label} className={styles.tabs}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={`${styles.tab} ${value === item.id ? styles.active : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {item.label}
          {item.badge}
        </button>
      ))}
    </GlassCard>
  )
}
