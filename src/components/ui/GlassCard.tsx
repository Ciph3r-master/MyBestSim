import type { ElementType, HTMLAttributes } from 'react'
import styles from './GlassCard.module.css'

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  interactive?: boolean
}

export function GlassCard({ as: Tag = 'div', interactive = false, className = '', ...rest }: GlassCardProps) {
  const classes = [styles.card, interactive && styles.interactive, className].filter(Boolean).join(' ')
  return <Tag className={classes} {...rest} />
}
