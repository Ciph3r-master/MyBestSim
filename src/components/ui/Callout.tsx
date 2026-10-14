import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './Callout.module.css'

interface CalloutProps {
  tone: 'info' | 'warning'
  icon: IconName
  children: ReactNode
}

export function Callout({ tone, icon, children }: CalloutProps) {
  return (
    <div className={`${styles.callout} ${styles[tone]}`} role="note">
      <Icon name={icon} size={18} />
      <div className={styles.body}>{children}</div>
    </div>
  )
}
