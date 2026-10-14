import { formatPercent } from '@/utils/format'
import styles from './ProgressRing.module.css'

const RADIUS = 34
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ProgressRingProps {
  /** Ratio entre 0 et 1. */
  value: number
  label: string
}

export function ProgressRing({ value, label }: ProgressRingProps) {
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 80 80" width="88" height="88" role="img" aria-label={`${label} : ${formatPercent(value)}`}>
        <circle cx="40" cy="40" r={RADIUS} className={styles.track} />
        <circle
          cx="40"
          cy="40"
          r={RADIUS}
          className={styles.bar}
          strokeDasharray={`${CIRCUMFERENCE * value} ${CIRCUMFERENCE}`}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" className={styles.value}>
          {formatPercent(value)}
        </text>
      </svg>
      <span>{label}</span>
    </div>
  )
}
