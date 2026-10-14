import type { ReactNode } from 'react'
import styles from './DashboardHeader.module.css'

interface DashboardHeaderProps {
  eyebrow: string
  title: string
  description: ReactNode
  actions?: ReactNode
}

export function DashboardHeader({ eyebrow, title, description, actions }: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {actions}
    </header>
  )
}
