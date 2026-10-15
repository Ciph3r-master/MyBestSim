import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { rovingIndex } from '@/utils/rovingFocus'
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
  /** Préfixe des identifiants : onglet `${idPrefix}-tab-${id}`, contenu `${idPrefix}-panel` (voir tabPanelProps). */
  idPrefix: string
}

/**
 * Onglets accessibles (motif WAI-ARIA « tabs ») : un seul arrêt de tabulation, flèches / Début / Fin
 * pour changer d'onglet, et chaque onglet relié à sa zone de contenu.
 */
export function Tabs<T extends string>({ items, value, onChange, label, idPrefix }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent) => {
    const next = rovingIndex(e.key, items.findIndex((i) => i.id === value), items.length)
    if (next === null) return
    e.preventDefault()
    onChange(items[next].id)
    refs.current[next]?.focus()
  }

  return (
    <GlassCard role="tablist" aria-label={label} className={styles.tabs} onKeyDown={onKeyDown}>
      {items.map((item, index) => {
        const selected = value === item.id
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el
            }}
            id={`${idPrefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.active : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            {item.label}
            {item.badge}
          </button>
        )
      })}
    </GlassCard>
  )
}
