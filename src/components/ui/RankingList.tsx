import styles from './RankingList.module.css'

export interface RankingItem {
  id: string
  label: string
  /** Valeur numérique utilisée pour la longueur de la barre. */
  value: number
  display: string
}

interface RankingListProps {
  items: RankingItem[]
  variant?: 'indigo' | 'teal'
  activeId?: string | null
  onSelect?: (id: string) => void
}

export function RankingList({ items, variant = 'indigo', activeId, onSelect }: RankingListProps) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1

  return (
    <ol className={styles.list}>
      {items.map((item, index) => {
        const content = (
          <>
            <span className={styles.index}>{index + 1}</span>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.track}>
              <i className={styles[variant]} style={{ width: `${(item.value / max) * 100}%` }} />
            </span>
            <span className={styles.value}>{item.display}</span>
          </>
        )
        const rowClass = `${styles.row} ${activeId === item.id ? styles.active : ''}`

        return (
          <li key={item.id}>
            {onSelect ? (
              <button type="button" className={`${rowClass} ${styles.clickable}`} onClick={() => onSelect(item.id)}>
                {content}
              </button>
            ) : (
              <div className={rowClass}>{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
