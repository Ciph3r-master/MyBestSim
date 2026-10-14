import { GlassCard } from '@/components/ui/GlassCard'
import { Icon } from '@/components/ui/Icon'
import styles from './ActiveFilter.module.css'

interface ActiveFilterProps {
  label: string
  onClear: () => void
}

export function ActiveFilter({ label, onClear }: ActiveFilterProps) {
  return (
    <GlassCard className={styles.pill}>
      Filtre actif : <strong>{label}</strong>
      <button type="button" className={styles.clear} onClick={onClear} aria-label="Retirer le filtre">
        <Icon name="close" size={14} />
      </button>
    </GlassCard>
  )
}
