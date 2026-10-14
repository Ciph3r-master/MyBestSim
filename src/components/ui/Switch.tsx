import styles from './Switch.module.css'

interface SwitchProps {
  checked: boolean
  onChange: () => void
  /** Libellé accessible (lu par les lecteurs d'écran). */
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      className={`${styles.switch} ${checked ? styles.on : ''}`}
      onClick={onChange}
    >
      <span className={styles.thumb} />
    </button>
  )
}
