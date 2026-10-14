import { GlassCard } from '@/components/ui/GlassCard'
import { Icon } from '@/components/ui/Icon'
import styles from './ActiveFilter.module.css'

interface ActiveFilterProps {
  label: string
  onClear: () => void
  /** Ouvre la liste des produits du filtre. */
  onShowProducts?: () => void
}

export function ActiveFilter({ label, onClear, onShowProducts }: ActiveFilterProps) {
  return (
    <GlassCard className={styles.pill}>
      Filtre actif : <strong>{label}</strong>
      {onShowProducts && (
        <button type="button" className={styles.products} onClick={onShowProducts}>
          Voir ses produits
        </button>
      )}
      <button type="button" className={styles.clear} onClick={onClear} aria-label="Retirer le filtre">
        <Icon name="close" size={14} />
      </button>
    </GlassCard>
  )
}
