import { GlassCard } from '@/components/ui/GlassCard'
import styles from './ProviderSelect.module.css'

interface ProviderSelectProps {
  providers: string[]
  value: string | null
  onChange: (provider: string | null) => void
}

export function ProviderSelect({ providers, value, onChange }: ProviderSelectProps) {
  return (
    <GlassCard as="label" className={styles.field}>
      <span className={styles.label}>Fournisseur</span>
      <select className={styles.select} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Tous ({providers.length})</option>
        {providers.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </GlassCard>
  )
}
